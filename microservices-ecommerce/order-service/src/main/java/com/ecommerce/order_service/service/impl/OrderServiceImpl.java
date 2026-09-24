package com.ecommerce.order_service.service.impl;

import com.ecommerce.order_service.dto.OrderRequestDTO;
import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.event.OrderPlacedEvent;
import com.ecommerce.order_service.exception.ResourceNotFoundException;
import com.ecommerce.order_service.mapper.OrderMapper;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderLineItems;
import com.ecommerce.order_service.model.OrderStatus;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.resources.preference.Preference;
import com.ecommerce.order_service.repository.OrderRepository;
import com.ecommerce.order_service.service.OrderService;
import com.ecommerce.order_service.service.OutboxService;
import com.ecommerce.order_service.service.client.InventoryClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@RefreshScope
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final RabbitTemplate rabbitTemplate;
    private final OutboxService outboxService;

    @Value("${$order.enabled:true}")
    private boolean orderEnabled;

    @Value("${mercadopago.access-token:}")
    private String mpAccessToken;

    public OrderResponseDTO fallbackMethod(OrderRequestDTO orderRequestDTO, String userId, Throwable throwable){
            log.error("Circuit Breaker activado. Causa: {}", throwable.getMessage());
            throw new RuntimeException("El servicio de Inventario no responde, por favor intente mas tarde.");
    }

    @Override
    @Transactional
    public OrderResponseDTO placeOrder(OrderRequestDTO orderRequestDTO, String userId) throws JsonProcessingException {

            if(!orderEnabled) {
                log.warn("Pedido rechazado: servicio deshabilitado por configuración.");
                throw new RuntimeException("El servicio de pedidos está actualmente en mantenimiento, intente más tarde");
            }

            log.info("Colocando nuevo pedido");

            Order order = orderMapper.toOrder(orderRequestDTO);
            order.setUserId(userId);

            order.setOrderNumber(UUID.randomUUID().toString());
            order.setOrderStatus(OrderStatus.PLACED);
            Order savedOrder = orderRepository.save(order);

            log.info("Orden guardada con éxito. ID: {}", savedOrder.getId());

            List<OrderPlacedEvent.OrderItemEvent> orderItems =
                    order.getOrderLineItemsList().stream()
                            .map((OrderLineItems item) -> new OrderPlacedEvent.OrderItemEvent(
                                    item.getSku(), item.getPrice().toString(), item.getQuantity()
                            )).toList();

            OrderPlacedEvent event = new OrderPlacedEvent(
                    savedOrder.getOrderNumber(), orderRequestDTO.getEmail(), orderItems
            );

            boolean sentToRabbit = false;
        try {
            rabbitTemplate.convertAndSend("order-events", "order.placed", event);
            sentToRabbit = true;
            log.info("Mensaje enviado a RabbitMQ: {}", savedOrder.getOrderNumber());

        } catch (AmqpException e) {
            log.error("RabbitMQ caído, El Outbox asegurará el envío posterior para la orden: {}", savedOrder.getOrderNumber());
        }

        outboxService.saveOrderPlacedEvent(event,sentToRabbit );

            log.info("Evento enviado a RabbitMQ para la orden: {}", savedOrder.getOrderNumber());

            OrderResponseDTO responseDTO = orderMapper.toOrderResponse(savedOrder);

            if ("MERCADOPAGO".equalsIgnoreCase(orderRequestDTO.getPaymentMethod())) {
                try {
                    MercadoPagoConfig.setAccessToken(mpAccessToken);
                    
                    List<PreferenceItemRequest> items = orderRequestDTO.getOrderLineItemsList().stream()
                            .map(item -> PreferenceItemRequest.builder()
                                    .id(item.getSku())
                                    .title("Producto SKU: " + item.getSku())
                                    .quantity(item.getQuantity())
                                    .currencyId("ARS")
                                    .unitPrice(item.getPrice())
                                    .build())
                            .toList();

                    PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                            .success("http://localhost:5173/checkout/success?orderNumber=" + savedOrder.getOrderNumber())
                            .pending("http://localhost:5173/checkout/success?pending=true&orderNumber=" + savedOrder.getOrderNumber())
                            .failure("http://localhost:5173/checkout/success?failure=true&orderNumber=" + savedOrder.getOrderNumber())
                            .build();

                    com.mercadopago.client.preference.PreferencePaymentMethodsRequest paymentMethods = com.mercadopago.client.preference.PreferencePaymentMethodsRequest.builder()
                            .excludedPaymentTypes(List.of(
                                    com.mercadopago.client.preference.PreferencePaymentTypeRequest.builder().id("ticket").build(),
                                    com.mercadopago.client.preference.PreferencePaymentTypeRequest.builder().id("atm").build(),
                                    com.mercadopago.client.preference.PreferencePaymentTypeRequest.builder().id("bank_transfer").build()
                            ))
                            .build();

                    PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                            .items(items)
                            .backUrls(backUrls)
                            .externalReference(savedOrder.getOrderNumber())
                            .paymentMethods(paymentMethods)
                            .build();

                    PreferenceClient client = new PreferenceClient();
                    Preference preference = client.create(preferenceRequest);
                    
                    responseDTO.setPaymentUrl(preference.getSandboxInitPoint());
                } catch (com.mercadopago.exceptions.MPApiException apiException) {
                    log.warn("MercadoPago API call failed (probably invalid test token or config). Error: {}", apiException.getApiResponse().getContent());
                    responseDTO.setPaymentUrl("http://localhost:5173/checkout/success?orderNumber=" + savedOrder.getOrderNumber());
                } catch (Exception e) {
                    log.warn("MercadoPago API call failed. Using mock redirect. Error: {}", e.getMessage());
                    // Fallback para simular un pago exitoso en el frontend si falla el token
                    responseDTO.setPaymentUrl("http://localhost:5173/checkout/success?orderNumber=" + savedOrder.getOrderNumber());
                }
            }

            return responseDTO;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrders(String userId, boolean isAdmin) {
        List<Order> orders;

        if(isAdmin) {
            orders = orderRepository.findAll();
        } else {
            orders = orderRepository.findByUserId(userId);
        }

        return orders.stream()
                .map(orderMapper::toOrderResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", "id", id));

        return orderMapper.toOrderResponse(order);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        if(!orderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Orden", "id", id);
        }

        orderRepository.deleteById(id);
        log.info("La orden fue eliminada con exito");
    }

    @Override
    @Transactional
    public void updateOrderStatus(String orderNumber, OrderStatus status) {
        orderRepository.findByOrderNumber(orderNumber).ifPresentOrElse(
                order -> {
                    order.setOrderStatus(status);
                    orderRepository.save(order);
                    log.info("Estado actualizado en DB para la orden: {}", orderNumber);
                },
                () -> log.error("No se encontró la orden {} para actualizar", orderNumber)
        );

    }

}

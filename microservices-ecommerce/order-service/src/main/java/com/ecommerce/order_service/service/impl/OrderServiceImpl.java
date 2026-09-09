package com.ecommerce.order_service.service.impl;

import com.ecommerce.order_service.dto.OrderRequestDTO;
import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.event.OrderPlacedEvent;
import com.ecommerce.order_service.exception.ResourceNotFoundException;
import com.ecommerce.order_service.mapper.OrderMapper;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderLineItems;
import com.ecommerce.order_service.model.OrderStatus;
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

            return orderMapper.toOrderResponse(savedOrder);
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

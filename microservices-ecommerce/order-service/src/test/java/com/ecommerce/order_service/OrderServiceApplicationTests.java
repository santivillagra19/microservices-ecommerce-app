package com.ecommerce.order_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import com.ecommerce.order_service.mapper.OrderMapper;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderLineItems;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.repository.OrderRepository;
import com.ecommerce.order_service.service.OrderService;
import com.ecommerce.order_service.service.MercadoPagoService;
import com.ecommerce.order_service.event.OrderConfirmedEvent;
import com.mercadopago.resources.payment.Payment;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class OrderServiceApplicationTests {

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @MockitoBean
    private MercadoPagoService mercadoPagoService;

    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    @Test
    void trackingApprovedPayment_ShouldPersistConfirmationOnlyOnce() throws Exception {
        Order order = pendingPaymentOrder();
        var response = orderService.getTrackedOrder(order.getId(), order.getTrackingToken());
        assertEquals(OrderStatus.CONFIRMED, response.getOrderStatus());
        assertNull(response.getTrackingToken());
        assertEquals(OrderStatus.CONFIRMED, orderRepository.findById(order.getId()).orElseThrow().getOrderStatus());

        orderService.getTrackedOrder(order.getId(), order.getTrackingToken());
        verify(mercadoPagoService, times(1)).findApprovedPayment(order.getOrderNumber());
        verify(rabbitTemplate, times(1)).convertAndSend(eq("order-events"), eq("order.confirmed"), any(OrderConfirmedEvent.class));
    }

    @Test
    void failedConfirmationEvent_ShouldRollBackDatabaseChange() throws Exception {
        Order order = pendingPaymentOrder();
        doThrow(new AmqpException("broker down")).when(rabbitTemplate)
                .convertAndSend(eq("order-events"), eq("order.confirmed"), any(OrderConfirmedEvent.class));

        assertThrows(ResponseStatusException.class,
                () -> orderService.getTrackedOrder(order.getId(), order.getTrackingToken()));
        assertEquals(OrderStatus.PLACED, orderRepository.findById(order.getId()).orElseThrow().getOrderStatus());
    }

    private Order pendingPaymentOrder() throws Exception {
        Order order = orderRepository.save(Order.builder().orderNumber(UUID.randomUUID().toString())
                .trackingToken(UUID.randomUUID().toString()).paymentMethod("MERCADOPAGO")
                .orderStatus(OrderStatus.PLACED).userId("GUEST").email("buyer@example.com")
                .orderLineItemsList(new ArrayList<>(List.of(new OrderLineItems(null, "SKU-1", new BigDecimal("10.00"), 2))))
                .build());
        Payment payment = mock(Payment.class);
        when(payment.getStatus()).thenReturn("approved");
        when(payment.getExternalReference()).thenReturn(order.getOrderNumber());
        when(payment.getTransactionAmount()).thenReturn(new BigDecimal("20.00"));
        when(payment.getCurrencyId()).thenReturn("ARS");
        when(mercadoPagoService.findApprovedPayment(order.getOrderNumber())).thenReturn(Optional.of(payment));
        return order;
    }

    @Test
    void regularOrderResponses_ShouldNotExposeTrackingCapability() {
        assertNull(orderMapper.toOrderResponse(Order.builder().trackingToken("private-token").build()).getTrackingToken());
    }

	@Test
	void contextLoads() {
	}

}

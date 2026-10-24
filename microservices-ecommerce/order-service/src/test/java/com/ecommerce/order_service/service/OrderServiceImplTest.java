package com.ecommerce.order_service.service;

import com.ecommerce.order_service.dto.OrderLineItemsRequestDTO;
import com.ecommerce.order_service.dto.OrderRequestDTO;
import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.mapper.OrderMapper;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.repository.OrderRepository;
import com.ecommerce.order_service.service.impl.OrderServiceImpl;
import com.mercadopago.resources.preference.Preference;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.exceptions.MPException;
import com.ecommerce.order_service.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderMapper orderMapper;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private OutboxService outboxService;

    @Mock
    private MercadoPagoService mercadoPagoService;

    @Mock
    private PaymentConfirmationService paymentConfirmationService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private Order order;
    private OrderRequestDTO orderRequestDTO;
    private OrderResponseDTO orderResponseDTO;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(orderService, "orderEnabled", true);

        order = Order.builder()
                .id(1L)
                .orderNumber("ORD-123")
                .orderStatus(OrderStatus.PLACED)
                .userId("user1")
                .orderLineItemsList(List.of())
                .build();

        orderRequestDTO = new OrderRequestDTO(List.of(
                new OrderLineItemsRequestDTO("LAPTOP-01", BigDecimal.valueOf(1000), 1)
        ), "user@example.com", "Test User", "5551234", "Test address", "BANK_TRANSFER");

        orderResponseDTO = OrderResponseDTO.builder()
                .id(1L).orderNumber("ORD-123").orderStatus(OrderStatus.PLACED)
                .email("user@example.com").orderLineItemsList(List.of()).build();
    }

    @Test
    void placeOrder_ShouldReturnOrderResponse() throws Exception {
        when(orderMapper.toOrder(any(OrderRequestDTO.class))).thenReturn(order);
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toOrderResponse(any(Order.class))).thenReturn(orderResponseDTO);

        OrderResponseDTO result = orderService.placeOrder(orderRequestDTO, "user1");

        assertNotNull(result);
        assertEquals("ORD-123", result.getOrderNumber());
        assertNotNull(result.getTrackingToken());
        assertDoesNotThrow(() -> java.util.UUID.fromString(result.getTrackingToken()));
        verify(orderRepository, times(1)).save(order);
        verify(rabbitTemplate, times(1)).convertAndSend(eq("order-events"), eq("order.placed"),
                any(com.ecommerce.order_service.event.OrderPlacedEvent.class));
        verify(outboxService, times(1)).saveOrderPlacedEvent(any(), eq(true));
    }

    @Test
    void placeOrder_WhenMercadoPagoFails_ShouldRejectWithoutPublishingOrder() throws Exception {
        prepareMercadoPagoOrder();
        when(mercadoPagoService.createPreference(any())).thenThrow(new MPException("API unavailable"));

        assertPaymentUnavailable();
    }

    @Test
    void placeOrder_WhenCircuitBreakerReturnsNull_ShouldRejectWithoutPublishingOrder() throws Exception {
        prepareMercadoPagoOrder();
        when(mercadoPagoService.createPreference(any())).thenReturn(null);

        assertPaymentUnavailable();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = " ")
    void placeOrder_WhenPaymentUrlIsMissing_ShouldRejectWithoutPublishingOrder(String url) throws Exception {
        prepareMercadoPagoOrder();
        Preference preference = mock(Preference.class);
        when(preference.getInitPoint()).thenReturn(url);
        when(mercadoPagoService.createPreference(any())).thenReturn(preference);

        assertPaymentUnavailable();
    }

    @Test
    void placeOrder_WhenMercadoPagoSucceeds_ShouldReturnProviderUrl() throws Exception {
        prepareMercadoPagoOrder();
        Preference preference = mock(Preference.class);
        when(preference.getInitPoint()).thenReturn("https://www.mercadopago.com.ar/checkout/test");
        when(mercadoPagoService.createPreference(any())).thenReturn(preference);

        OrderResponseDTO result = orderService.placeOrder(orderRequestDTO, "user1");

        assertEquals(preference.getInitPoint(), result.getPaymentUrl());
        verify(rabbitTemplate).convertAndSend(eq("order-events"), eq("order.placed"), any(com.ecommerce.order_service.event.OrderPlacedEvent.class));
        verify(outboxService).saveOrderPlacedEvent(any(), eq(true));
    }

    private void prepareMercadoPagoOrder() {
        orderRequestDTO.setPaymentMethod("MERCADOPAGO");
        ReflectionTestUtils.setField(orderService, "mpAccessToken", "TEST-token");
        when(orderMapper.toOrder(any(OrderRequestDTO.class))).thenReturn(order);
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toOrderResponse(any(Order.class))).thenReturn(orderResponseDTO);
    }

    private void assertPaymentUnavailable() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> orderService.placeOrder(orderRequestDTO, "user1"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        assertNull(orderResponseDTO.getPaymentUrl());
        verifyNoInteractions(rabbitTemplate, outboxService);
    }

    @Test
    void trackingWithWrongToken_ShouldNotReadPaymentProvider() {
        assertThrows(ResourceNotFoundException.class, () -> orderService.getTrackedOrder(1L, "wrong-token"));
        verifyNoInteractions(mercadoPagoService, paymentConfirmationService);
    }

    @Test
    void trackingPendingPayment_ShouldNotConfirmOrder() throws Exception {
        prepareTrackedOrder();
        when(mercadoPagoService.findApprovedPayment("ORD-123")).thenReturn(Optional.empty());

        assertEquals(OrderStatus.PLACED, orderService.getTrackedOrder(1L, "tracking-token").getOrderStatus());
        verifyNoInteractions(paymentConfirmationService);
    }

    @Test
    void trackingApprovedPayment_ShouldUseVerifiedPaymentProcessor() throws Exception {
        prepareTrackedOrder();
        Payment payment = mock(Payment.class);
        when(mercadoPagoService.findApprovedPayment("ORD-123")).thenReturn(Optional.of(payment));
        doAnswer(invocation -> { order.setOrderStatus(OrderStatus.CONFIRMED); return null; })
                .when(paymentConfirmationService).process(payment);

        assertEquals(OrderStatus.CONFIRMED, orderService.getTrackedOrder(1L, "tracking-token").getOrderStatus());
        verify(paymentConfirmationService).process(payment);
    }

    @Test
    void trackingWhenProviderFails_ShouldReturn503AndRemainPending() throws Exception {
        order.setPaymentMethod("MERCADOPAGO");
        when(orderRepository.findByIdAndTrackingToken(1L, "tracking-token")).thenReturn(Optional.of(order));
        when(mercadoPagoService.findApprovedPayment("ORD-123")).thenThrow(new MPException("unavailable"));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> orderService.getTrackedOrder(1L, "tracking-token"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        assertEquals(OrderStatus.PLACED, order.getOrderStatus());
        verifyNoInteractions(paymentConfirmationService);
    }

    @Test
    void trackingConfirmedOrder_ShouldNotCheckOrProcessPaymentAgain() {
        prepareTrackedOrder();
        order.setOrderStatus(OrderStatus.CONFIRMED);

        assertEquals(OrderStatus.CONFIRMED, orderService.getTrackedOrder(1L, "tracking-token").getOrderStatus());
        verifyNoInteractions(mercadoPagoService, paymentConfirmationService);
    }

    private void prepareTrackedOrder() {
        order.setPaymentMethod("MERCADOPAGO");
        when(orderRepository.findByIdAndTrackingToken(1L, "tracking-token")).thenReturn(Optional.of(order));
        when(orderMapper.toOrderResponse(order)).thenAnswer(invocation -> OrderResponseDTO.builder()
                .id(order.getId()).orderStatus(order.getOrderStatus()).build());
    }

    @Test
    void trackingBankTransfer_ShouldRemainPendingWithoutContactingMercadoPago() {
        prepareTrackedOrder();
        order.setPaymentMethod("TRANSFERENCIA");

        assertEquals(OrderStatus.PLACED, orderService.getTrackedOrder(1L, "tracking-token").getOrderStatus());
        assertEquals(OrderStatus.PLACED, order.getOrderStatus());
        verifyNoInteractions(mercadoPagoService, paymentConfirmationService, rabbitTemplate);
    }

    @Test
    void getOrderById_ShouldReturnOrder() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderMapper.toOrderResponse(any(Order.class))).thenReturn(orderResponseDTO);

        OrderResponseDTO result = orderService.getOrderById(1L);

        assertNotNull(result);
        assertEquals("ORD-123", result.getOrderNumber());
        verify(orderRepository, times(1)).findById(1L);
    }
}

package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.event.OrderConfirmedEvent;
import com.ecommerce.order_service.exception.GlobalControllerAdvice;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderLineItems;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.repository.OrderRepository;
import com.ecommerce.order_service.service.PaymentConfirmationService;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.exceptions.MPException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.MockedConstruction;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MercadoPagoWebhookControllerTest {
    private static final String SECRET = "test-signature-secret";
    private static final String PATH = "/api/v1/webhook/mercadopago";
    private OrderRepository repository;
    private RabbitTemplate rabbit;
    private MercadoPagoWebhookController controller;
    private MockMvc mvc;
    private Order order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        repository = mock(OrderRepository.class);
        rabbit = mock(RabbitTemplate.class);
        controller = new MercadoPagoWebhookController(new PaymentConfirmationService(repository, rabbit));
        ReflectionTestUtils.setField(controller, "mpAccessToken", "TEST-token");
        ReflectionTestUtils.setField(controller, "webhookSecret", SECRET);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalControllerAdvice()).build();
        order = Order.builder().orderNumber("ORD-1").email("buyer@example.com")
                .orderStatus(OrderStatus.PLACED)
                .orderLineItemsList(List.of(new OrderLineItems(1L, "SKU-1", new BigDecimal("10.00"), 2)))
                .build();
        payment = mock(Payment.class);
        when(payment.getStatus()).thenReturn("approved");
        when(payment.getExternalReference()).thenReturn("ORD-1");
        when(payment.getCurrencyId()).thenReturn("ARS");
        when(payment.getTransactionAmount()).thenReturn(new BigDecimal("20.00"));
        when(repository.findByOrderNumberForUpdate("ORD-1")).thenReturn(Optional.of(order));
    }

    @Test
    void missingSecret_ShouldRejectWithoutCallingPaymentProvider() throws Exception {
        ReflectionTestUtils.setField(controller, "webhookSecret", "");
        mvc.perform(signedRequest("123")).andExpect(status().isServiceUnavailable());
        verifyNoInteractions(repository, rabbit);
    }

    @Test
    void unsignedNotification_ShouldBeUnauthorized() throws Exception {
        mvc.perform(post(PATH).param("data.id", "123")).andExpect(status().isUnauthorized());
        verifyNoInteractions(repository, rabbit);
    }

    @Test
    void invalidSignature_ShouldNotReachProviderOrChangeOrder() throws Exception {
        try (MockedConstruction<PaymentClient> clients = mockConstruction(PaymentClient.class)) {
            mvc.perform(post(PATH).param("data.id", "123").header("x-signature", "ts=1700000000,v1=bad"))
                    .andExpect(status().isUnauthorized());
            assertEquals(0, clients.constructed().size());
        }
        verifyNoInteractions(repository, rabbit);
    }

    @Test
    void changingSignedPaymentId_ShouldBeUnauthorized() throws Exception {
        mvc.perform(signedRequest("456"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(repository, rabbit);
    }

    @Test
    void invalidPaymentId_ShouldBeBadRequest() throws Exception {
        mvc.perform(post(PATH).param("data.id", "not-a-payment"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(repository, rabbit);
    }

    @Test
    void approvedPayment_ShouldConfirmAndIgnoreRepeatedNotification() throws Exception {
        try (MockedConstruction<PaymentClient> clients = paymentClients()) {
            mvc.perform(signedRequest("123")).andExpect(status().isOk());
            mvc.perform(signedRequest("123")).andExpect(status().isOk());
            assertEquals(2, clients.constructed().size());
        }
        assertEquals(OrderStatus.CONFIRMED, order.getOrderStatus());
        verify(repository, times(1)).save(order);
        verify(rabbit, times(1)).convertAndSend(eq("order-events"), eq("order.confirmed"), any(OrderConfirmedEvent.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"1.00", "21.00"})
    void incorrectAmount_ShouldNotConfirmOrSendNotification(String amount) throws Exception {
        when(payment.getTransactionAmount()).thenReturn(new BigDecimal(amount));
        try (MockedConstruction<PaymentClient> ignored = paymentClients()) {
            mvc.perform(signedRequest("123")).andExpect(status().isServiceUnavailable());
        }
        verify(repository, never()).save(any());
        verifyNoInteractions(rabbit);
    }

    @Test
    void incorrectCurrency_ShouldNotConfirmOrSendNotification() throws Exception {
        when(payment.getCurrencyId()).thenReturn("USD");
        try (MockedConstruction<PaymentClient> ignored = paymentClients()) {
            mvc.perform(signedRequest("123")).andExpect(status().isServiceUnavailable());
        }
        verify(repository, never()).save(any());
        verifyNoInteractions(rabbit);
    }

    @Test
    void providerUnavailable_ShouldReturnRetryableError() throws Exception {
        try (MockedConstruction<PaymentClient> ignored = mockConstruction(PaymentClient.class,
                (client, context) -> when(client.get(123L)).thenThrow(new MPException("unavailable")))) {
            mvc.perform(signedRequest("123")).andExpect(status().isServiceUnavailable());
        }
        verifyNoInteractions(repository, rabbit);
    }

    @Test
    void brokerUnavailable_ShouldReturnRetryableError() throws Exception {
        doThrow(new AmqpException("unavailable")).when(rabbit)
                .convertAndSend(eq("order-events"), eq("order.confirmed"), any(OrderConfirmedEvent.class));
        try (MockedConstruction<PaymentClient> ignored = paymentClients()) {
            mvc.perform(signedRequest("123")).andExpect(status().isServiceUnavailable());
        }
    }

    @Test
    void rejectedPayment_ShouldNotCancelConfirmedOrder() throws Exception {
        order.setOrderStatus(OrderStatus.CONFIRMED);
        when(payment.getStatus()).thenReturn("rejected");
        try (MockedConstruction<PaymentClient> ignored = paymentClients()) {
            mvc.perform(signedRequest("123")).andExpect(status().isOk());
        }
        assertEquals(OrderStatus.CONFIRMED, order.getOrderStatus());
        verify(repository, never()).save(any());
        verifyNoInteractions(rabbit);
    }

    private MockedConstruction<PaymentClient> paymentClients() {
        return mockConstruction(PaymentClient.class, (client, context) -> when(client.get(123L)).thenReturn(payment));
    }

    private MockHttpServletRequestBuilder signedRequest(String paymentId) throws Exception {
        String timestamp = "1700000000";
        String manifest = "id:123;request-id:request-1;ts:" + timestamp + ";";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = HexFormat.of().formatHex(mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8)));
        return post(PATH).param("data.id", paymentId).header("x-request-id", "request-1")
                .header("x-signature", "ts=" + timestamp + ",v1=" + signature);
    }
}

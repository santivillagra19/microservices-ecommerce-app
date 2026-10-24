package com.ecommerce.order_service.service;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.net.MPResultsResourcesPage;
import com.mercadopago.net.MPSearchRequest;
import com.mercadopago.net.UrlFormatter;
import com.mercadopago.resources.payment.Payment;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.MockedConstruction;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MercadoPagoServiceTest {
    @ParameterizedTest
    @CsvSource({"OTHER-ORDER,approved", "ORD-1,pending", "ORD-1,rejected"})
    void lookup_ShouldIgnoreForeignOrUnapprovedPayments(String reference, String status) throws Exception {
        assertLookup(reference, status, false);
    }

    @Test
    void lookup_ShouldReturnOnlyMatchingApprovedPayment() throws Exception {
        assertLookup("ORD-1", "approved", true);
    }

    private void assertLookup(String reference, String status, boolean expected) throws Exception {
        MercadoPagoService service = new MercadoPagoService();
        ReflectionTestUtils.setField(service, "accessToken", "TEST-token");
        Payment payment = mock(Payment.class);
        when(payment.getExternalReference()).thenReturn(reference);
        when(payment.getStatus()).thenReturn(status);
        MPResultsResourcesPage<Payment> page = mock(MPResultsResourcesPage.class);
        when(page.getResults()).thenReturn(List.of(payment));
        try (MockedConstruction<PaymentClient> clients = mockConstruction(PaymentClient.class,
                (client, context) -> when(client.search(any(), any())).thenAnswer(invocation -> {
                    MPSearchRequest request = invocation.getArgument(0);
                    String url = UrlFormatter.format("/v1/payments/search", request.getParameters());
                    assertTrue(url.contains("external_reference=ORD-1"));
                    return page;
                }))) {
            assertEquals(expected, service.findApprovedPayment("ORD-1").isPresent());
        }
    }

}

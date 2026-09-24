package com.ecommerce.payment_service.config;

import ch.qos.logback.classic.spi.ILoggingEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class MaskingMessageConverterTest {

    private MaskingMessageConverter converter;

    @BeforeEach
    void setUp() {
        converter = new MaskingMessageConverter();
    }

    private ILoggingEvent mockEvent(String message) {
        ILoggingEvent event = Mockito.mock(ILoggingEvent.class);
        when(event.getFormattedMessage()).thenReturn(message);
        return event;
    }

    @Test
    void shouldMaskCreditCardPanRetainingLastFour() {
        String log = "Processing payment with card 4532015698741234 for amount 5000";
        String masked = converter.convert(mockEvent(log));
        assertFalse(masked.contains("4532015698741234"));
        assertTrue(masked.contains("************1234"));
    }

    @Test
    void shouldMaskCvv() {
        String log = "Payload contains cvv: 123 and order ORD-1";
        String masked = converter.convert(mockEvent(log));
        assertFalse(masked.contains("123"));
        assertTrue(masked.contains("cvv=***"));
    }

    @Test
    void shouldMaskCvvWithWhitespaceInKeyword() {
        String log = "Payload contains security code: 789 for transaction";
        String masked = converter.convert(mockEvent(log));
        assertFalse(masked.contains("789"));
        assertTrue(masked.contains("security code=***"));
    }

    @Test
    void shouldMaskExpirationDate() {
        String log = "Payload contains expiry: 12/28 for card";
        String masked = converter.convert(mockEvent(log));
        assertFalse(masked.contains("12/28"));
        assertTrue(masked.contains("expiry=**/**"));
    }

    @Test
    void shouldMaskExpirationDateWithWhitespaceInKeyword() {
        String log = "Payload contains Expiration date: 11/29 and exp month = 12/28";
        String masked = converter.convert(mockEvent(log));
        assertFalse(masked.contains("11/29"));
        assertFalse(masked.contains("12/28"));
        assertTrue(masked.contains("Expiration date=**/**"));
        assertTrue(masked.contains("exp month=**/**"));
    }

    @Test
    void shouldMaskMercadoPagoAccessToken() {
        String log = "Initializing SDK with TEST-1234567890-123456-abcdef123456";
        String masked = converter.convert(mockEvent(log));
        assertFalse(masked.contains("abcdef123456"));
        assertTrue(masked.contains("TEST-****-PROTECTED"));
    }

    @Test
    void shouldMaskBearerToken() {
        String log = "Header Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test.sig";
        String masked = converter.convert(mockEvent(log));
        assertFalse(masked.contains("eyJhbGciOiJIUzI1NiJ9"));
        assertTrue(masked.contains("Bearer [PROTECTED]"));
    }

    @Test
    void shouldHandleNullOrEmptySafely() {
        assertNull(converter.convert(mockEvent(null)));
        assertEquals("", converter.convert(mockEvent("")));
    }
}

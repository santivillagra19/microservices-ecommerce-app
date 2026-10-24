package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderOwnershipControllerTest {
    private final OrderService service = mock(OrderService.class);
    private final OrderController controller = new OrderController(service);

    private Jwt token(String role) {
        return Jwt.withTokenValue("test").header("alg", "RS256").subject("account-id")
                .claim("realm_access", Map.of("roles", List.of(role))).build();
    }

    @Test
    void adminPersonalHistoryMustOnlyRequestOwnedOrders() {
        controller.getOrders(token("ADMIN"));
        verify(service).getOrders("account-id", false);
        verifyNoMoreInteractions(service);
    }

    @Test
    void adminPanelMayRequestAllOrdersIncludingGuests() {
        controller.getAdminOrders(token("ADMIN"));
        verify(service).getOrders("account-id", true);
    }

    @Test
    void ordinaryAccountCannotReadAdminHistory() {
        var error = assertThrows(ResponseStatusException.class, () -> controller.getAdminOrders(token("USER")));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verifyNoInteractions(service);
    }

    @Test
    void guestsHaveNoPersonalOrAdminHistory() {
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ResponseStatusException.class,
                () -> controller.getOrders(null)).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ResponseStatusException.class,
                () -> controller.getAdminOrders(null)).getStatusCode());
        verifyNoInteractions(service);
    }
}

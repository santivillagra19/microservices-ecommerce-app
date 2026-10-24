package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.dto.OrderRequestDTO;
import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;
import java.util.Collection;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/v1/order")
@RequiredArgsConstructor
@Tag(name = "Order", description = "Endpoints for managing orders")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Place order", description = "Creates a new order")
    public OrderResponseDTO placeOrder(@Valid @RequestBody OrderRequestDTO orderRequest,
                                       @AuthenticationPrincipal Jwt jwt
    ) throws com.fasterxml.jackson.core.JsonProcessingException {
        String userId = (jwt != null) ? jwt.getSubject() : "GUEST";
        return orderService.placeOrder(orderRequest, userId);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Get orders", description = "Retrieves only the current user's orders")
    public List<OrderResponseDTO> getOrders(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return orderService.getOrders(jwt.getSubject(), false);
    }

    @GetMapping("/admin")
    @Operation(summary = "Get all orders", description = "Admin only, includes guest orders")
    public List<OrderResponseDTO> getAdminOrders(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null || !(realmAccess.get("roles") instanceof Collection<?> roles)
                || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return orderService.getOrders(jwt.getSubject(), true);
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<OrderResponseDTO> getTrackedOrder(@PathVariable Long id,
            @RequestHeader("X-Order-Token") UUID trackingToken) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(orderService.getTrackedOrder(id, trackingToken.toString()));
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Get order by ID", description = "Retrieves an order by its ID")
    public OrderResponseDTO getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete order", description = "Deletes an order by its ID")
    public void deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
    }
}

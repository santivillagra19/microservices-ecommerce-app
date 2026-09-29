package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.dto.OrderRequestDTO;
import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;
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
    @Operation(summary = "Get orders", description = "Retrieves all orders for the current user (or all if admin)")
    public List<OrderResponseDTO> getOrders(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        boolean isAdmin = false;

        Map<String, Object> realmAccess = jwt.getClaim("realm_access");

        if(realmAccess != null && realmAccess.containsKey("roles")){
            List<String> roles = (List<String>) realmAccess.get("roles");

            isAdmin = roles.stream().anyMatch(role -> role.equalsIgnoreCase("ADMIN"));
        }

        return orderService.getOrders(userId, isAdmin);
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

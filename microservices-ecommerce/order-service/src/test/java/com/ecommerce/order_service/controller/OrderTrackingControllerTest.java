package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.service.OrderService;
import com.ecommerce.order_service.exception.GlobalControllerAdvice;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class OrderTrackingControllerTest {
    @Test
    void guestTrackingWithoutCapability_ShouldNotExposeOrder() throws Exception {
        OrderService service = mock(OrderService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new OrderController(service))
                .setControllerAdvice(new GlobalControllerAdvice()).build();
        mvc.perform(get("/api/v1/order/1/tracking")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/order/1/tracking").header("X-Order-Token", "not-a-token"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/order/not-an-id/tracking").header("X-Order-Token", "b62f7799-058b-47d0-b166-b06b583c2990"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void guestTrackingWithCapability_ShouldNeverCacheOrderDetails() throws Exception {
        OrderService service = mock(OrderService.class);
        String token = "b62f7799-058b-47d0-b166-b06b583c2990";
        when(service.getTrackedOrder(1L, token)).thenReturn(OrderResponseDTO.builder()
                .id(1L).orderStatus(OrderStatus.PLACED).build());

        MockMvcBuilders.standaloneSetup(new OrderController(service)).build()
                .perform(get("/api/v1/order/1/tracking").header("X-Order-Token", token))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.orderStatus").value("PLACED"));
    }
}

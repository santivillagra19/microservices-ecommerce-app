package com.ecommerce.order_service.service;

import com.ecommerce.order_service.dto.OrderLineItemsRequestDTO;
import com.ecommerce.order_service.dto.OrderRequestDTO;
import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.mapper.OrderMapper;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.repository.OrderRepository;
import com.ecommerce.order_service.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

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
        ), "user@example.com");

        orderResponseDTO = new OrderResponseDTO(1L, "ORD-123", "user1", OrderStatus.PLACED.name(), List.of());
    }

    @Test
    void placeOrder_ShouldReturnOrderResponse() throws Exception {
        when(orderMapper.toOrder(any(OrderRequestDTO.class))).thenReturn(order);
        when(orderRepository.save(any(Order.class))).thenReturn(order);
        when(orderMapper.toOrderResponse(any(Order.class))).thenReturn(orderResponseDTO);

        OrderResponseDTO result = orderService.placeOrder(orderRequestDTO, "user1");

        assertNotNull(result);
        assertEquals("ORD-123", result.orderNumber());
        verify(orderRepository, times(1)).save(order);
        verify(rabbitTemplate, times(1)).convertAndSend(eq("order-events"), eq("order.placed"), any());
        verify(outboxService, times(1)).saveOrderPlacedEvent(any(), eq(true));
    }

    @Test
    void getOrderById_ShouldReturnOrder() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderMapper.toOrderResponse(any(Order.class))).thenReturn(orderResponseDTO);

        OrderResponseDTO result = orderService.getOrderById(1L);

        assertNotNull(result);
        assertEquals("ORD-123", result.orderNumber());
        verify(orderRepository, times(1)).findById(1L);
    }
}

package com.ecommerce.order_service.service;

import com.ecommerce.order_service.dto.OrderRequestDTO;
import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.model.OrderStatus;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.util.List;

public interface OrderService {

    OrderResponseDTO placeOrder(OrderRequestDTO orderRequestDTO, String userId) throws JsonProcessingException;
    List<OrderResponseDTO> getOrders(String userId, boolean isAdmin);
    OrderResponseDTO getOrderById(Long id);
    void deleteOrder(Long id);
    void updateOrderStatus(String orderNumber, OrderStatus status);

}

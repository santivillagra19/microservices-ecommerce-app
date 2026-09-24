package com.ecommerce.order_service.dto;

import com.ecommerce.order_service.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderResponseDTO {
    private Long id;
    private String orderNumber;
    private OrderStatus orderStatus;
    private List<OrderLineItemsResponseDTO> orderLineItemsList;
    private String paymentUrl;
}

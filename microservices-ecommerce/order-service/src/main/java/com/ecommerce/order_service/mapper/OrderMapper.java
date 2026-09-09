package com.ecommerce.order_service.mapper;

import com.ecommerce.order_service.dto.OrderLineItemsRequestDTO;
import com.ecommerce.order_service.dto.OrderLineItemsResponseDTO;
import com.ecommerce.order_service.dto.OrderRequestDTO;
import com.ecommerce.order_service.dto.OrderResponseDTO;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderLineItems;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    // Request to Entity
    Order toOrder(OrderRequestDTO orderRequestDTO);

    // Request to Entity
    OrderLineItems toOrderLineItems(OrderLineItemsRequestDTO orderLineItemsRequestDTO);

    // Entity to Response
    OrderResponseDTO toOrderResponse(Order order);

    // Entity to Response
    OrderLineItemsResponseDTO toLineItemsResponse(OrderLineItems orderLineItems);
}

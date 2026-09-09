package com.ecommerce.order_service.service;

import com.ecommerce.order_service.event.OrderPlacedEvent;
import com.fasterxml.jackson.core.JsonProcessingException;

public interface OutboxService {
    void saveOrderPlacedEvent(OrderPlacedEvent orderPlacedEvent, boolean isProcessed) throws JsonProcessingException;

}

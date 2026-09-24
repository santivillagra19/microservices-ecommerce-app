package com.ecommerce.product_service.dto;

public record InventoryResponseDTO(
    Long id,
    String sku,
    Integer quantity,
    boolean inStock
) {}
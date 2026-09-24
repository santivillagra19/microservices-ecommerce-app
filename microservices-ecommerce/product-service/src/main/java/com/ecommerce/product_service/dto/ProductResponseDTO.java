package com.ecommerce.product_service.dto;

import java.math.BigDecimal;

public record ProductResponseDTO (
    String id,
    String name,
    String description,
    BigDecimal price,
    String category,
    String brand,
    String imageUrl,
    java.util.List<String> imageUrls,
    boolean inStock
) {}
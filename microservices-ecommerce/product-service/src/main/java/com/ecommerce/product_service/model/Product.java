package com.ecommerce.product_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Document(value = "product")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class Product {
    @Id
    private String id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String brand;
    private String imageUrl;
    private java.util.List<String> imageUrls;

    public java.util.List<String> getImageUrls() {
        if (imageUrls != null && !imageUrls.isEmpty()) return imageUrls;
        if (imageUrl != null) return java.util.List.of(imageUrl);
        return java.util.List.of();
    }

    public String getImageUrl() {
        if (imageUrls != null && !imageUrls.isEmpty()) return imageUrls.get(0);
        return imageUrl;
    }
}
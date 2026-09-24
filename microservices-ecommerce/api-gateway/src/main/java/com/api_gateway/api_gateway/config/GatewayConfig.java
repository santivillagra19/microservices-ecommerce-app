package com.api_gateway.api_gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("product-service", r -> r
                        .path("/api/v1/product/**")
                        .uri("http://product-service:8081"))
                .route("inventory-service", r -> r
                        .path("/api/v1/inventory/**")
                        .uri("http://inventory-service:8083"))
                .route("order-service", r -> r
                        .path("/api/v1/order/**")
                        .uri("http://order-service:8082"))
                .route("payment-service", r -> r
                        .path("/api/v1/payment/**")
                        .uri("http://payment-service:8085"))
                .route("openapi-product", r -> r
                        .path("/product-service/v3/api-docs")
                        .filters(f -> f.setPath("/v3/api-docs"))
                        .uri("http://product-service:8081"))
                .route("openapi-order", r -> r
                        .path("/order-service/v3/api-docs")
                        .filters(f -> f.setPath("/v3/api-docs"))
                        .uri("http://order-service:8082"))
                .route("openapi-inventory", r -> r
                        .path("/inventory-service/v3/api-docs")
                        .filters(f -> f.setPath("/v3/api-docs"))
                        .uri("http://inventory-service:8083"))
                .route("openapi-payment", r -> r
                        .path("/payment-service/v3/api-docs")
                        .filters(f -> f.setPath("/v3/api-docs"))
                        .uri("http://payment-service:8085"))
                .build();
    }
}

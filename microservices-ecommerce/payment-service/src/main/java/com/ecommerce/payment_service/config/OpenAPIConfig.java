package com.ecommerce.payment_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI paymentServiceAPI() {
        return new OpenAPI()
                .info(new Info().title("Payment Service API")
                        .description("API Documentation for Payment Service in the Ecommerce Microservices architecture.")
                        .version("v1.0.0")
                        .license(new License().name("Apache 2.0")));
    }
}

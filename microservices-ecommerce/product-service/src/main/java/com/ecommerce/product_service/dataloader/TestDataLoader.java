package com.ecommerce.product_service.dataloader;

import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class TestDataLoader implements CommandLineRunner {
    private final ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {

        if (productRepository.count() == 0) {
            System.out.println("Base de datos de productos vacía. Puedes cargar productos desde el Panel de Admin.");
        } else {
            System.out.println("✅ La base de datos ya contiene productos. No se requiere inicialización.");
        }
    }
}

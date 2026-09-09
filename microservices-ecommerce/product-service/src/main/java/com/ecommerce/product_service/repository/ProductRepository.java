package com.ecommerce.product_service.repository;

import com.ecommerce.product_service.model.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProductRepository extends MongoRepository<Product, String> {

}

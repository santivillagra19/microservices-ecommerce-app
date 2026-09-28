package com.ecommerce.product_service.service;

import com.ecommerce.product_service.dto.ProductRequestDTO;
import com.ecommerce.product_service.dto.ProductResponseDTO;
import com.ecommerce.product_service.mapper.ProductMapper;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.repository.ProductRepository;
import com.ecommerce.product_service.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product product;
    private ProductRequestDTO productRequestDTO;
    private ProductResponseDTO productResponseDTO;

    @BeforeEach
    void setUp() {
        product = Product.builder()
                .id("1")
                .name("Notebook")
                .description("A high performance notebook")
                .price(BigDecimal.valueOf(1500))
                .build();

        productRequestDTO = new ProductRequestDTO(
                "Notebook", "A high performance notebook", BigDecimal.valueOf(1500), "category", "brand", java.util.List.of()
        );

        productResponseDTO = new ProductResponseDTO(
                "1", "Notebook", "A high performance notebook", BigDecimal.valueOf(1500), "category", "brand", null, java.util.List.of(), true
        );
    }

    @Test
    void createProduct_ShouldReturnProductResponse() {
        when(productMapper.toProduct(any(ProductRequestDTO.class))).thenReturn(product);
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productMapper.toProductResponseDTO(any(Product.class))).thenReturn(productResponseDTO);

        ProductResponseDTO result = productService.createProduct(productRequestDTO);

        assertNotNull(result);
        assertEquals(result.name(), productRequestDTO.name());
        assertEquals(result.price(), productRequestDTO.price());
        verify(productRepository, times(1)).save(product);
    }

    /*
    @Test
    void getAllProducts_ShouldReturnListOfProducts() {
        when(productRepository.findAll()).thenReturn(List.of(product));
        when(productMapper.toProductResponseDTO(any(Product.class))).thenReturn(productResponseDTO);

        List<ProductResponseDTO> result = productService.getProducts(null, null, null, null, null);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertEquals(result.get(0).id(), "1");
    }
    */
}

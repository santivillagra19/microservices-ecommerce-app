package com.ecommerce.product_service.service.impl;

import com.ecommerce.product_service.dto.ProductRequestDTO;
import com.ecommerce.product_service.dto.ProductResponseDTO;
import com.ecommerce.product_service.dto.InventoryResponseDTO;
import com.ecommerce.product_service.exception.ResourceNotFoundException;
import com.ecommerce.product_service.mapper.ProductMapper;
import com.ecommerce.product_service.model.Product;
import com.ecommerce.product_service.repository.ProductRepository;
import com.ecommerce.product_service.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ProductServiceImpl implements ProductService {
    private final ProductRepository repository;
    private final ProductMapper mapper;
    private final RestClient restClient;
    private final MongoTemplate mongoTemplate;

    public ProductServiceImpl(ProductRepository repository, ProductMapper mapper, RestClient.Builder restClientBuilder, MongoTemplate mongoTemplate) {
        this.repository = repository;
        this.mapper = mapper;
        this.mongoTemplate = mongoTemplate;
        this.restClient = restClientBuilder.baseUrl("http://INVENTORY-SERVICE").build();
    }

    @Override
    public ProductResponseDTO createProduct(ProductRequestDTO requestDTO) {
        Product product = mapper.toProduct(requestDTO);
        Product savedProduct = repository.save(product);
        log.info("Product {} guardado", savedProduct.getName());
        return mapper.toProductResponseDTO(savedProduct);
    }

    @Override
    public List<ProductResponseDTO> getProducts(String search, String category, String brand, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        log.info("getProducts called with search={}, category={}, brand={}, minPrice={}, maxPrice={}", search, category, brand, minPrice, maxPrice);
        Query query = new Query();
        if (search != null && !search.isEmpty()) {
            query.addCriteria(new Criteria().orOperator(
                Criteria.where("name").regex(search, "i"),
                Criteria.where("description").regex(search, "i")
            ));
        }
        if (category != null && !category.isEmpty()) {
            query.addCriteria(Criteria.where("category").regex("^" + category + "$", "i"));
        }
        if (brand != null && !brand.isEmpty()) {
            query.addCriteria(Criteria.where("brand").regex("^" + brand + "$", "i"));
        }
        if (minPrice != null || maxPrice != null) {
            Criteria priceCriteria = Criteria.where("price");
            if (minPrice != null) priceCriteria.gte(minPrice);
            if (maxPrice != null) priceCriteria.lte(maxPrice);
            query.addCriteria(priceCriteria);
        }

        List<Product> products = mongoTemplate.find(query, Product.class);

        Map<String, Boolean> inventoryMap = Map.of();
        try {
            InventoryResponseDTO[] inventoryArray = restClient.get()
                    .uri("/api/v1/inventory")
                    .retrieve()
                    .body(InventoryResponseDTO[].class);
            
            if (inventoryArray != null) {
                inventoryMap = List.of(inventoryArray).stream()
                        .collect(Collectors.toMap(InventoryResponseDTO::sku, InventoryResponseDTO::inStock));
            }
        } catch (Exception e) {
            log.error("Error al obtener inventario: {}", e.getMessage());
        }

        Map<String, Boolean> finalInventoryMap = inventoryMap;

        return products
                .stream()
                .map(product -> {
                    ProductResponseDTO dto = mapper.toProductResponseDTO(product);
                    boolean inStock = finalInventoryMap.getOrDefault(product.getId(), false);
                    return new ProductResponseDTO(
                            dto.id(), dto.name(), dto.description(), dto.price(),
                            dto.category(), dto.brand(), dto.imageUrl(), dto.imageUrls(), inStock
                    );
                })
                .toList();
    }

    @Override
    public ProductResponseDTO getProductById(String id) {
        Product product = repository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("Producto","id", id)
        );

        ProductResponseDTO dto = mapper.toProductResponseDTO(product);
        boolean inStock = false;
        try {
            Boolean stockStatus = restClient.get()
                    .uri("/api/v1/inventory/{sku}", id)
                    .retrieve()
                    .body(Boolean.class);
            if (stockStatus != null) {
                inStock = stockStatus;
            }
        } catch (Exception e) {
            log.error("Error al obtener inventario para {}: {}", id, e.getMessage());
        }

        return new ProductResponseDTO(
                dto.id(), dto.name(), dto.description(), dto.price(),
                dto.category(), dto.brand(), dto.imageUrl(), dto.imageUrls(), inStock
        );
    }

    @Override
    public ProductResponseDTO updateProduct(String id, ProductRequestDTO productRequest) {
        Product product = repository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("Producto","id", id)
        );

        mapper.updateProductFromRequest(productRequest, product);
        Product updatedProduct = repository.save(product);
        log.info("Product {} actualizado", updatedProduct.getName());

        return mapper.toProductResponseDTO(updatedProduct);
    }

    @Override
    public void deleteProduct(String id) {
        if(!repository.existsById(id)) {
            throw new ResourceNotFoundException("Producto","id", id);
        }

        repository.deleteById(id);
        log.info("Product {} fue eliminado", id);
    }
}
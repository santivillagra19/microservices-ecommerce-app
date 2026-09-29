package com.ecommerce.inventory_service.service.impl;

import com.ecommerce.inventory_service.dto.InventoryRequestDTO;
import com.ecommerce.inventory_service.dto.InventoryResponseDTO;
import com.ecommerce.inventory_service.exception.ResourceAlreadyExistsException;
import com.ecommerce.inventory_service.exception.ResourceNotFoundException;
import com.ecommerce.inventory_service.mapper.InventoryMapper;
import com.ecommerce.inventory_service.model.Inventory;
import com.ecommerce.inventory_service.repository.InventoryRepository;
import com.ecommerce.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@RefreshScope
public class InventoryServiceImpl implements InventoryService {
    private final InventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;

    @Value("${inventory.allow-backorders:false}")
    private boolean allowBackOrders;

    @Override
    @Transactional(readOnly = true)
    public boolean isInStock(String sku, Integer quantity) {

        if(allowBackOrders) {
            log.warn("MODO BACKORDER ACTIVO: Autorizando stock para SKU: {}", sku);
            return true;
        }

        return inventoryRepository.findBySku(sku)
                .map(inventory -> inventory.getQuantity() >= quantity)
                .orElse(false);
    }

    @Override
    @Transactional
    public InventoryResponseDTO createInventory(InventoryRequestDTO inventoryRequest) {
        boolean exists = inventoryRepository.existsBySku(inventoryRequest.getSku());
        if(exists) {
            throw new ResourceAlreadyExistsException("inventario", "SKU", inventoryRequest.getSku());
        }

        Inventory inventory = inventoryMapper.toModel(inventoryRequest);
        Inventory savedInventory = inventoryRepository.save(inventory);

        log.info("Inventario creado para el SKU: {}", savedInventory.getSku());
        return inventoryMapper.toResponse(savedInventory);

    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryResponseDTO> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(inventoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public InventoryResponseDTO updateInventory(Long id, InventoryRequestDTO inventoryRequest) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Inventario", "id", id)
                );

        inventory.setSku(inventoryRequest.getSku());
        inventory.setQuantity(inventoryRequest.getQuantity());

        Inventory updatedInventory = inventoryRepository.save(inventory);
        log.info("Inventario actualizado para el ID: {}", id);

        return inventoryMapper.toResponse(updatedInventory);
    }

    @Override
    @Transactional
    public void deleteInventory(Long id) {
        if(!inventoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("inventario", "id", id);
        }

        inventoryRepository.deleteById(id);
        log.info("Inventario eliminado con ID: {}", id);
    }

    @Override
    @Transactional
    public void reduceStock(String sku, Integer quantity) {
        var inventory = inventoryRepository.findBySku(sku)
                .orElseThrow(
                        () -> new RuntimeException("Producto no encontrado para : " + sku)
                );

        if(inventory.getQuantity() < quantity) {
            throw new RuntimeException("Stock insuficiente para: " + sku);
        }

        inventory.setQuantity(inventory.getQuantity() - quantity);
        inventoryRepository.save(inventory);
    }

    @Override
    @Transactional
    public void addStock(String sku, Integer quantity) {
        var inventory = inventoryRepository.findBySku(sku)
                .orElseThrow(
                        () -> new RuntimeException("Producto no encontrado para: " + sku)
                );
        inventory.setQuantity(inventory.getQuantity() + quantity);
        inventoryRepository.save(inventory);
    }
}

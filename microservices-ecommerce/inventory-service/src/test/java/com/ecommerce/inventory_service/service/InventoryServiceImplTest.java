package com.ecommerce.inventory_service.service;

import com.ecommerce.inventory_service.dto.InventoryRequestDTO;
import com.ecommerce.inventory_service.dto.InventoryResponseDTO;
import com.ecommerce.inventory_service.exception.ResourceNotFoundException;
import com.ecommerce.inventory_service.model.Inventory;
import com.ecommerce.inventory_service.repository.InventoryRepository;
import com.ecommerce.inventory_service.service.impl.InventoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private com.ecommerce.inventory_service.mapper.InventoryMapper inventoryMapper;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private Inventory inventory;
    private InventoryRequestDTO inventoryRequest;
    private InventoryResponseDTO inventoryResponse;

    @BeforeEach
    void setUp() {
        inventory = Inventory.builder()
                .id(1L)
                .sku("LAPTOP-01")
                .quantity(10)
                .build();
                
        inventoryRequest = new InventoryRequestDTO("LAPTOP-01", 10);
        inventoryResponse = new InventoryResponseDTO(1L, "LAPTOP-01", 10, true);
    }

    @Test
    void isInStock_WhenStockExists_ShouldReturnTrue() {
        when(inventoryRepository.findBySku("LAPTOP-01")).thenReturn(Optional.of(inventory));
        
        boolean result = inventoryService.isInStock("LAPTOP-01", 5);
        
        assertTrue(result);
        verify(inventoryRepository, times(1)).findBySku("LAPTOP-01");
    }

    @Test
    void isInStock_WhenNotEnoughStock_ShouldReturnFalse() {
        when(inventoryRepository.findBySku("LAPTOP-01")).thenReturn(Optional.of(inventory));
        
        boolean result = inventoryService.isInStock("LAPTOP-01", 15);
        
        assertFalse(result);
        verify(inventoryRepository, times(1)).findBySku("LAPTOP-01");
    }

    @Test
    void reduceStock_WhenStockExists_ShouldReduceQuantity() {
        when(inventoryRepository.findBySku("LAPTOP-01")).thenReturn(Optional.of(inventory));
        
        inventoryService.reduceStock("LAPTOP-01", 3);
        
        assertEquals(7, inventory.getQuantity());
        verify(inventoryRepository, times(1)).save(inventory);
    }

    @Test
    void createInventory_ShouldReturnResponse() {
        when(inventoryRepository.existsBySku(anyString())).thenReturn(false);
        when(inventoryMapper.toModel(any(InventoryRequestDTO.class))).thenReturn(inventory);
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);
        when(inventoryMapper.toResponse(any(Inventory.class))).thenReturn(inventoryResponse);
        
        InventoryResponseDTO response = inventoryService.createInventory(inventoryRequest);
        
        assertNotNull(response);
        assertEquals("LAPTOP-01", response.sku());
        assertEquals(10, response.quantity());
    }
}

package com.ecommerce.inventory_service.controller;

import com.ecommerce.inventory_service.service.InventoryService;
import com.ecommerce.inventory_service.dto.InventoryRequestDTO;
import com.ecommerce.inventory_service.dto.InventoryResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Endpoints for managing product inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/{sku}")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Check stock by SKU", description = "Verifies if the specified product is currently in stock")
    public boolean isInStock(@PathVariable String sku, @RequestParam(value = "quantity", defaultValue = "1") Integer quantity) {
        return inventoryService.isInStock(sku, quantity);
    }

    @PostMapping
    @Operation(summary = "Create inventory", description = "Adds a new inventory record for a product")
    public ResponseEntity<InventoryResponseDTO> createInventory(@Valid @RequestBody InventoryRequestDTO inventoryRequest) {
        InventoryResponseDTO response = inventoryService.createInventory(inventoryRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Get all inventory", description = "Retrieves the complete list of inventory records")
    public List<InventoryResponseDTO> getAllInventory(HttpServletRequest request) {


        return inventoryService.getAllInventory();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update inventory", description = "Updates an existing inventory record by its ID")
    public ResponseEntity<InventoryResponseDTO> updateInventory(@PathVariable Long id, @Valid @RequestBody InventoryRequestDTO inventoryRequest) {
        InventoryResponseDTO response = inventoryService.updateInventory(id, inventoryRequest);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/reduce/{sku}")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Reduce stock", description = "Reduces the stock of a given SKU by the specified quantity")
    public String reduceStock(@PathVariable String sku, @RequestParam Integer quantity) {
        inventoryService.reduceStock(sku, quantity);
        return "Stock reducido exitosamente";
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete inventory", description = "Removes an inventory record by its ID")
    public void deleteInventory(@PathVariable Long id) {
        inventoryService.deleteInventory(id);
    }
}

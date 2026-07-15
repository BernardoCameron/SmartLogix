package com.smartlogix.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record CreateInventoryItemRequest(
        @NotBlank String sku,
        @NotBlank String productName,
        String description,
        String category,
        BigDecimal price,
        String imageUrl,
        @NotBlank String warehouseCode,
        @Min(0) int initialQuantity,
        @Min(0) int reorderLevel
) {
}

package com.smartlogix.inventory.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InventoryItemResponse(
        String sku,
        String productName,
        String description,
        String category,
        BigDecimal price,
        String imageUrl,
        boolean active,
        String warehouseCode,
        int availableQuantity,
        int reservedQuantity,
        int reorderLevel,
        double averageRating,
        int ratingCount,
        OffsetDateTime updatedAt
) {
}

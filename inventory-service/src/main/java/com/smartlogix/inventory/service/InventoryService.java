package com.smartlogix.inventory.service;

import com.smartlogix.inventory.domain.InventoryItem;
import com.smartlogix.inventory.dto.CreateInventoryItemRequest;
import com.smartlogix.inventory.dto.InventoryAvailabilityResponse;
import com.smartlogix.inventory.dto.InventoryItemResponse;
import com.smartlogix.inventory.exception.InventoryNotFoundException;
import com.smartlogix.inventory.exception.InventoryOperationException;
import com.smartlogix.inventory.repository.InventoryItemRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InventoryService {

    private final InventoryItemRepository repository;

    public InventoryService(InventoryItemRepository repository) {
        this.repository = repository;
    }

    public InventoryItemResponse createItem(CreateInventoryItemRequest request) {
        if (repository.existsBySku(request.sku())) {
            throw new InventoryOperationException("El SKU ya existe: " + request.sku());
        }

        InventoryItem item = new InventoryItem();
        item.setSku(request.sku().trim().toUpperCase());
        item.setProductName(request.productName().trim());
        item.setWarehouseCode(request.warehouseCode().trim().toUpperCase());
        item.setAvailableQuantity(request.initialQuantity());
        item.setReservedQuantity(0);
        item.setReorderLevel(request.reorderLevel());
        item.setPrice(request.price());
        item.setCategory(request.category());
        item.setDescription(request.description());
        item.setImageUrl(request.imageUrl());
        item.setActive(true);
        item.setAverageRating(BigDecimal.ZERO);
        item.setRatingCount(0);

        return toResponse(repository.save(item));
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // solo productos activos con stock para el catalogo publico
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> findActiveCatalog() {
        return repository.findAll().stream()
                .filter(InventoryItem::isActive)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse findBySku(String sku) {
        return toResponse(loadBySku(sku));
    }

    @Transactional(readOnly = true)
    public InventoryAvailabilityResponse checkAvailability(String sku, int quantity) {
        InventoryItem item = loadBySku(sku);
        boolean available = item.getAvailableQuantity() >= quantity;
        return new InventoryAvailabilityResponse(
                item.getSku(),
                quantity,
                item.getAvailableQuantity(),
                available
        );
    }

    public InventoryItemResponse setActive(String sku, boolean active) {
        InventoryItem item = loadBySku(sku);
        item.setActive(active);
        return toResponse(repository.save(item));
    }

    // acumula la calificacion y recalcula el promedio
    public InventoryItemResponse addRating(String sku, int value) {
        if (value < 1 || value > 5) {
            throw new InventoryOperationException("La calificacion debe ser entre 1 y 5.");
        }
        InventoryItem item = loadBySku(sku);
        BigDecimal totalAcumulado = item.getAverageRating()
                .multiply(BigDecimal.valueOf(item.getRatingCount()))
                .add(BigDecimal.valueOf(value));
        int newCount = item.getRatingCount() + 1;
        BigDecimal newAvg = totalAcumulado.divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP);
        item.setAverageRating(newAvg);
        item.setRatingCount(newCount);
        return toResponse(repository.save(item));
    }

    public InventoryItemResponse reserve(String sku, int quantity) {
        InventoryItem item = loadBySku(sku);
        if (quantity <= 0) throw new InventoryOperationException("La cantidad debe ser mayor a 0.");
        if (item.getAvailableQuantity() < quantity) {
            throw new InventoryOperationException(
                    "Stock insuficiente para SKU " + sku + ". Disponible: " + item.getAvailableQuantity());
        }
        item.setAvailableQuantity(item.getAvailableQuantity() - quantity);
        item.setReservedQuantity(item.getReservedQuantity() + quantity);
        return toResponse(repository.save(item));
    }

    public InventoryItemResponse release(String sku, int quantity) {
        InventoryItem item = loadBySku(sku);
        if (quantity <= 0) throw new InventoryOperationException("La cantidad debe ser mayor a 0.");
        if (item.getReservedQuantity() < quantity) {
            throw new InventoryOperationException("No hay suficiente stock reservado para liberar en SKU " + sku);
        }
        item.setReservedQuantity(item.getReservedQuantity() - quantity);
        item.setAvailableQuantity(item.getAvailableQuantity() + quantity);
        return toResponse(repository.save(item));
    }

    public InventoryItemResponse dispatch(String sku, int quantity) {
        InventoryItem item = loadBySku(sku);
        if (quantity <= 0) throw new InventoryOperationException("La cantidad debe ser mayor a 0.");
        if (item.getReservedQuantity() < quantity) {
            throw new InventoryOperationException("No hay stock reservado suficiente para despachar SKU " + sku);
        }
        item.setReservedQuantity(item.getReservedQuantity() - quantity);
        return toResponse(repository.save(item));
    }

    private InventoryItem loadBySku(String sku) {
        return repository.findBySku(sku.trim().toUpperCase())
                .orElseThrow(() -> new InventoryNotFoundException("No existe inventario para SKU: " + sku));
    }

    private InventoryItemResponse toResponse(InventoryItem item) {
        return new InventoryItemResponse(
                item.getSku(),
                item.getProductName(),
                item.getDescription(),
                item.getCategory(),
                item.getPrice(),
                item.getImageUrl(),
                item.getWarehouseCode(),
                item.getAvailableQuantity(),
                item.getReservedQuantity(),
                item.getReorderLevel(),
                item.getAverageRating() != null ? item.getAverageRating().doubleValue() : 0.0,
                item.getRatingCount(),
                item.isActive(),
                item.getUpdatedAt()
        );
    }
}

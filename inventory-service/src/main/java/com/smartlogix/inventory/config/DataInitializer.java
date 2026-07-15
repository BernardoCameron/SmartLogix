package com.smartlogix.inventory.config;

import com.smartlogix.inventory.domain.InventoryItem;
import com.smartlogix.inventory.repository.InventoryItemRepository;
import java.math.BigDecimal;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final InventoryItemRepository repository;

    public DataInitializer(InventoryItemRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        // 1. Corregir y activar productos antiguos ya existentes en la base de datos
        List<InventoryItem> existentes = repository.findAll();
        if (!existentes.isEmpty()) {
            log.info("Corrigiendo y activando productos preexistentes en la base de datos...");
            for (InventoryItem item : existentes) {
                boolean modificado = false;
                if (!item.isActive()) {
                    item.setActive(true);
                    modificado = true;
                }
                if (item.getPrice() == null) {
                    item.setPrice(new BigDecimal("129990"));
                    modificado = true;
                }
                if (item.getCategory() == null || item.getCategory().isBlank()) {
                    item.setCategory("Hardware");
                    modificado = true;
                }
                if (item.getImageUrl() == null || item.getImageUrl().isBlank()) {
                    item.setImageUrl("https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80");
                    modificado = true;
                }
                if (modificado) {
                    repository.save(item);
                }
            }
            log.info("Correccion de productos preexistentes completada.");
            return;
        }
        log.info("Inicializando productos de hardware de ejemplo...");

        List<InventoryItem> productos = List.of(
            build("PROC-001", "Procesador AMD Ryzen 7 5700X", "Procesador de 8 nucleos y 16 hilos, ideal para gaming y productividad sin graficos integrados.",
                "Procesadores", new BigDecimal("189990"), "BOD-A", 50, 10,
                "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80"),

            build("PROC-002", "Procesador Intel Core i5-12400F", "Procesador de 6 nucleos y 12 hilos, excelente relacion precio/rendimiento para gaming de entrada.",
                "Procesadores", new BigDecimal("129990"), "BOD-A", 40, 8,
                "https://images.unsplash.com/photo-1591405351990-4726e331f141?w=400&q=80"),

            build("GPU-001", "Tarjeta de Video NVIDIA RTX 4060 Ti 8GB", "Tarjeta grafica de ultima generacion, soporta DLSS 3 y trazado de rayos en resolucion 1080p y 1440p.",
                "Tarjetas de Video", new BigDecimal("449990"), "BOD-B", 15, 3,
                "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80"),

            build("MEM-001", "Memoria RAM DDR4 16GB (2x8GB) 3200MHz", "Kit de memoria RAM de alto rendimiento con disipador de aluminio y soporte XMP 2.0.",
                "Memorias RAM", new BigDecimal("45990"), "BOD-A", 80, 15,
                "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80"),

            build("SSD-001", "Disco Estado Solido M.2 NVMe 1TB Kingston", "Unidad SSD de alta velocidad, lectura de hasta 3500MB/s, conexion PCIe Gen4x4.",
                "Almacenamiento", new BigDecimal("65990"), "BOD-B", 60, 12,
                "https://images.unsplash.com/photo-1597852074816-d933c4d2b988?w=400&q=80"),

            build("PLACA-001", "Placa Madre ASUS Prime B550M-A Wi-Fi II", "Placa madre micro-ATX socket AM4 compatible con procesadores AMD Ryzen serie 5000, con Wi-Fi integrado.",
                "Placas Madres", new BigDecimal("119990"), "BOD-A", 25, 5,
                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"),

            build("FUEN-001", "Fuente de Poder 750W 80 Plus Bronze", "Fuente de poder de 750W con certificacion de eficiencia 80 Plus Bronze y ventilador silencioso de 120mm.",
                "Fuentes de Poder", new BigDecimal("69990"), "BOD-C", 30, 6,
                "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400&q=80"),

            build("GABI-001", "Gabinete Gamer ATX Vidrio Templado", "Gabinete con panel lateral de vidrio templado, incluye 3 ventiladores ARGB frontales y excelente flujo de aire.",
                "Gabinetes", new BigDecimal("54990"), "BOD-C", 20, 4,
                "https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=400&q=80")
        );

        repository.saveAll(productos);
        log.info("Se crearon {} productos de hardware de ejemplo.", productos.size());
    }

    private InventoryItem build(String sku, String name, String description,
                                String category, BigDecimal price, String warehouse,
                                int stock, int reorder, String imageUrl) {
        InventoryItem item = new InventoryItem();
        item.setSku(sku);
        item.setProductName(name);
        item.setDescription(description);
        item.setCategory(category);
        item.setPrice(price);
        item.setWarehouseCode(warehouse);
        item.setAvailableQuantity(stock);
        item.setReservedQuantity(0);
        item.setReorderLevel(reorder);
        item.setActive(true);
        item.setAverageRating(0.0);
        item.setRatingCount(0);
        item.setImageUrl(imageUrl);
        return item;
    }
}

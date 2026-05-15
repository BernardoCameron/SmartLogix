package com.smartlogix.inventory.listener;

import com.smartlogix.inventory.event.OrderCreatedEvent;
import com.smartlogix.inventory.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);
    private final InventoryService inventoryService;

    public OrderEventListener(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @RabbitListener(queues = com.smartlogix.inventory.config.RabbitMQConfig.QUEUE_NAME)
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Recibido evento OrderCreated para la orden: {}", event.orderNumber());
        try {
            for (OrderCreatedEvent.OrderLineEvent line : event.lines()) {
                inventoryService.reserve(line.sku(), line.quantity());
            }
            log.info("Inventario reservado exitosamente para la orden: {}", event.orderNumber());
        } catch (Exception e) {
            log.error("Error al procesar reserva de inventario para la orden {}: {}", event.orderNumber(), e.getMessage());
            // En un sistema real se enviaria un evento de OrderFailed o DLQ
        }
    }
}

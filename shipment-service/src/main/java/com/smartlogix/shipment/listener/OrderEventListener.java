package com.smartlogix.shipment.listener;

import com.smartlogix.shipment.config.RabbitMQConfig;
import com.smartlogix.shipment.dto.CreateShipmentRequest;
import com.smartlogix.shipment.event.ShipmentRequestedEvent;
import com.smartlogix.shipment.service.ShipmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);
    private final ShipmentService shipmentService;

    public OrderEventListener(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void handleShipmentRequestedEvent(ShipmentRequestedEvent event) {
        log.info("Recibida solicitud de despacho para orden: {}", event.orderNumber());
        try {
            CreateShipmentRequest request = new CreateShipmentRequest(
                    event.orderNumber(),
                    event.destinationAddress(),
                    event.totalUnits()
            );
            shipmentService.createShipment(request);
            log.info("Despacho creado exitosamente para orden: {}", event.orderNumber());
        } catch (Exception e) {
            log.error("Error al procesar solicitud de despacho para orden: {}", event.orderNumber(), e);
            // Optionally we can send to a DLQ or update order status to FAILED in the future
        }
    }
}

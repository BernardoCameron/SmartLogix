package com.smartlogix.shipment.event;

public record ShipmentRequestedEvent(
        String orderNumber,
        String destinationAddress,
        int totalUnits
) {}

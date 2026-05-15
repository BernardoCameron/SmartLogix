package com.smartlogix.order.event;

public record ShipmentRequestedEvent(
        String orderNumber,
        String destinationAddress,
        int totalUnits
) {}

package com.smartlogix.inventory.event;

import java.math.BigDecimal;
import java.util.List;

public record OrderCreatedEvent(
        String orderNumber,
        String customerEmail,
        String shippingAddress,
        List<OrderLineEvent> lines,
        BigDecimal totalAmount
) {
    public record OrderLineEvent(
            String sku,
            int quantity
    ) {}
}

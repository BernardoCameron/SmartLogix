package com.smartlogix.order.dto;

import com.smartlogix.order.domain.OrderStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record OrderResponse(
        String orderNumber,
        String customerName,
        String customerEmail,
        String shippingAddress,
        OrderStatus status,
        BigDecimal totalAmount,
        String couponCode,
        BigDecimal discountAmount,
        String trackingCode,
        String reason,
        OffsetDateTime createdAt,
        List<OrderLineResponse> lines
) {
}

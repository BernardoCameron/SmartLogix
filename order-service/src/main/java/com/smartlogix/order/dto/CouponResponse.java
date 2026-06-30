package com.smartlogix.order.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CouponResponse(
        Long id,
        String code,
        BigDecimal discountPercent,
        boolean active,
        OffsetDateTime expiresAt,
        Integer usageLimit,
        int usageCount
) {}

package com.smartlogix.order.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CreateCouponRequest(
        @NotBlank String code,
        @NotNull @DecimalMin("1") @DecimalMax("100") BigDecimal discountPercent,
        Integer usageLimit,
        OffsetDateTime expiresAt
) {}

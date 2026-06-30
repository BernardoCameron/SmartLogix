package com.smartlogix.order.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    // porcentaje de descuento, ej: 10 = 10%
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(nullable = false)
    private boolean active;

    // null = sin limite de tiempo
    @Column
    private OffsetDateTime expiresAt;

    // null = sin limite de usos
    @Column
    private Integer usageLimit;

    @Column(nullable = false)
    private int usageCount;

    public Long getId() { return id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public Integer getUsageLimit() { return usageLimit; }
    public void setUsageLimit(Integer usageLimit) { this.usageLimit = usageLimit; }

    public int getUsageCount() { return usageCount; }
    public void setUsageCount(int usageCount) { this.usageCount = usageCount; }
}

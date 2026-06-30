package com.smartlogix.order.service;

import com.smartlogix.order.domain.Coupon;
import com.smartlogix.order.dto.CreateCouponRequest;
import com.smartlogix.order.dto.CouponResponse;
import com.smartlogix.order.repository.CouponRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CouponService {

    private final CouponRepository repository;

    public CouponService(CouponRepository repository) {
        this.repository = repository;
    }

    public CouponResponse create(CreateCouponRequest request) {
        if (repository.existsByCode(request.code().toUpperCase())) {
            throw new IllegalArgumentException("El codigo de cupon ya existe: " + request.code());
        }
        Coupon coupon = new Coupon();
        coupon.setCode(request.code().trim().toUpperCase());
        coupon.setDiscountPercent(request.discountPercent());
        coupon.setActive(true);
        coupon.setUsageLimit(request.usageLimit());
        coupon.setExpiresAt(request.expiresAt());
        coupon.setUsageCount(0);
        return toResponse(repository.save(coupon));
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public CouponResponse setActive(Long id, boolean active) {
        Coupon coupon = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cupon no encontrado: " + id));
        coupon.setActive(active);
        return toResponse(repository.save(coupon));
    }

    // valida el cupon y devuelve el porcentaje de descuento (0 si no aplica)
    // no incrementa el contador aqui, eso se hace al confirmar la orden
    @Transactional(readOnly = true)
    public BigDecimal validate(String code) {
        Coupon coupon = repository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Cupon no valido: " + code));

        if (!coupon.isActive()) {
            throw new IllegalArgumentException("El cupon esta desactivado.");
        }
        if (coupon.getExpiresAt() != null && OffsetDateTime.now().isAfter(coupon.getExpiresAt())) {
            throw new IllegalArgumentException("El cupon ha expirado.");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsageCount() >= coupon.getUsageLimit()) {
            throw new IllegalArgumentException("El cupon ha alcanzado su limite de usos.");
        }
        return coupon.getDiscountPercent();
    }

    // registra el uso del cupon al crear la orden
    public void registerUsage(String code) {
        repository.findByCode(code.trim().toUpperCase()).ifPresent(coupon -> {
            coupon.setUsageCount(coupon.getUsageCount() + 1);
            repository.save(coupon);
        });
    }

    private CouponResponse toResponse(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getDiscountPercent(),
                coupon.isActive(),
                coupon.getExpiresAt(),
                coupon.getUsageLimit(),
                coupon.getUsageCount()
        );
    }
}

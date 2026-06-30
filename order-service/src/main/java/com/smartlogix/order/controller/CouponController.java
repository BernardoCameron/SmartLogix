package com.smartlogix.order.controller;

import com.smartlogix.order.dto.CreateCouponRequest;
import com.smartlogix.order.dto.CouponResponse;
import com.smartlogix.order.service.CouponService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/orders/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    // listar todos los cupones (admin)
    @GetMapping
    public List<CouponResponse> list() {
        return couponService.findAll();
    }

    // crear cupon (admin)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CouponResponse create(@Valid @RequestBody CreateCouponRequest request) {
        return couponService.create(request);
    }

    // activar o desactivar cupon (admin)
    @PatchMapping("/{id}/status")
    public CouponResponse setStatus(@PathVariable Long id, @RequestParam boolean active) {
        return couponService.setActive(id, active);
    }

    // validar cupon: devuelve el descuento si es valido
    @GetMapping("/validate")
    public Map<String, Object> validate(@RequestParam String code) {
        try {
            BigDecimal discount = couponService.validate(code);
            return Map.of("valid", true, "discountPercent", discount, "code", code.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Map.of("valid", false, "message", e.getMessage());
        }
    }
}

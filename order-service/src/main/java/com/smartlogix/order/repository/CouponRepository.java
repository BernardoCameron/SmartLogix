package com.smartlogix.order.repository;

import com.smartlogix.order.domain.Coupon;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);
    boolean existsByCode(String code);
}

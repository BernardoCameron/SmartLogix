package com.smartlogix.order.service;

import com.smartlogix.order.event.OrderCreatedEvent;
import com.smartlogix.order.event.ShipmentRequestedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import com.smartlogix.order.domain.OrderLine;
import com.smartlogix.order.domain.OrderStatus;
import com.smartlogix.order.domain.PurchaseOrder;
import com.smartlogix.order.dto.CreateOrderRequest;
import com.smartlogix.order.dto.OrderLineRequest;
import com.smartlogix.order.dto.OrderLineResponse;
import com.smartlogix.order.dto.OrderResponse;
import com.smartlogix.order.exception.OrderNotFoundException;
import com.smartlogix.order.repository.PurchaseOrderRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderService {

    private final PurchaseOrderRepository repository;
    private final RabbitTemplate rabbitTemplate;
    private final CouponService couponService;

    public OrderService(
            PurchaseOrderRepository repository,
            RabbitTemplate rabbitTemplate,
            CouponService couponService
    ) {
        this.repository = repository;
        this.rabbitTemplate = rabbitTemplate;
        this.couponService = couponService;
    }

    public OrderResponse createOrder(CreateOrderRequest request) {
        PurchaseOrder order = buildOrder(request);
        repository.save(order);

        List<OrderCreatedEvent.OrderLineEvent> lineEvents = order.getLines().stream()
                .map(line -> new OrderCreatedEvent.OrderLineEvent(line.getSku(), line.getQuantity()))
                .toList();

        OrderCreatedEvent event = new OrderCreatedEvent(
                order.getOrderNumber(),
                order.getCustomerEmail(),
                order.getShippingAddress(),
                lineEvents,
                order.getTotalAmount()
        );

        rabbitTemplate.convertAndSend(
                com.smartlogix.order.config.RabbitMQConfig.EXCHANGE_NAME,
                com.smartlogix.order.config.RabbitMQConfig.ROUTING_KEY,
                event
        );

        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByNumber(String orderNumber) {
        PurchaseOrder order = repository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new OrderNotFoundException("No existe la orden " + orderNumber));
        return toResponse(order);
    }

    public OrderResponse updateOrderStatus(String orderNumber, OrderStatus status) {
        PurchaseOrder order = repository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new OrderNotFoundException("No existe la orden " + orderNumber));

        order.setStatus(status);
        repository.save(order);

        if (status == OrderStatus.SHIPMENT_REQUESTED) {
            int totalUnits = order.getLines().stream()
                    .mapToInt(OrderLine::getQuantity)
                    .sum();

            ShipmentRequestedEvent event = new ShipmentRequestedEvent(
                    order.getOrderNumber(),
                    order.getShippingAddress(),
                    totalUnits
            );

            rabbitTemplate.convertAndSend(
                    com.smartlogix.order.config.RabbitMQConfig.EXCHANGE_NAME,
                    com.smartlogix.order.config.RabbitMQConfig.ROUTING_KEY_SHIPMENT,
                    event
            );
        }

        return toResponse(order);
    }

    private PurchaseOrder buildOrder(CreateOrderRequest request) {
        PurchaseOrder order = new PurchaseOrder();
        order.setCustomerName(request.customerName().trim());
        order.setCustomerEmail(request.customerEmail().trim().toLowerCase());
        order.setShippingAddress(request.shippingAddress().trim());
        order.setStatus(OrderStatus.PENDING);

        BigDecimal subtotal = calculateSubtotal(request.lines());
        BigDecimal discountAmount = BigDecimal.ZERO;

        // aplicar cupon si se envio uno
        if (request.couponCode() != null && !request.couponCode().isBlank()) {
            try {
                BigDecimal discountPercent = couponService.validate(request.couponCode());
                discountAmount = subtotal.multiply(discountPercent)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                order.setCouponCode(request.couponCode().trim().toUpperCase());
                couponService.registerUsage(request.couponCode());
            } catch (IllegalArgumentException e) {
                // si el cupon no es valido, se ignora y no se aplica descuento
                // el frontend ya valido antes de llegar aqui
            }
        }

        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(subtotal.subtract(discountAmount));

        for (OrderLineRequest lineRequest : request.lines()) {
            OrderLine line = new OrderLine();
            line.setSku(lineRequest.sku().trim().toUpperCase());
            line.setQuantity(lineRequest.quantity());
            line.setUnitPrice(lineRequest.unitPrice());
            order.addLine(line);
        }

        return order;
    }

    private BigDecimal calculateSubtotal(List<OrderLineRequest> lines) {
        return lines.stream()
                .map(line -> line.unitPrice().multiply(BigDecimal.valueOf(line.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private OrderResponse toResponse(PurchaseOrder order) {
        List<OrderLineResponse> lines = order.getLines().stream()
                .map(line -> new OrderLineResponse(
                        line.getSku(),
                        line.getQuantity(),
                        line.getUnitPrice(),
                        line.getUnitPrice().multiply(BigDecimal.valueOf(line.getQuantity()))
                ))
                .toList();

        return new OrderResponse(
                order.getOrderNumber(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getShippingAddress(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCouponCode(),
                order.getDiscountAmount(),
                order.getTrackingCode(),
                order.getRejectionReason(),
                order.getCreatedAt(),
                lines
        );
    }
}

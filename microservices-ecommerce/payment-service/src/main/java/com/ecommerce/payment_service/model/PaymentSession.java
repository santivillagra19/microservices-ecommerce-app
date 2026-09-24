package com.ecommerce.payment_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "t_payment_sessions", indexes = {
    @Index(name = "idx_payment_session_id", columnList = "sessionId", unique = true),
    @Index(name = "idx_payment_session_order", columnList = "orderNumber")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSession {

    public static final Duration SESSION_TTL = Duration.ofMinutes(10);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @Column(nullable = false, unique = true)
    private String sessionId;

    @Column(nullable = false)
    private String orderNumber;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "ARS";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "status_detail", length = 100)
    private String statusDetail;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "t_payment_session_items", joinColumns = @JoinColumn(name = "session_id"))
    @Builder.Default
    private List<OrderItemEmbeddable> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.expiresAt == null) {
            this.expiresAt = this.createdAt.plus(SESSION_TTL);
        }
        if (this.status == null) {
            this.status = PaymentStatus.PENDING;
        }
        if (this.currency == null || this.currency.isBlank()) {
            this.currency = "ARS";
        }
    }

    public boolean isExpired() {
        return this.status == PaymentStatus.EXPIRED || Instant.now().isAfter(this.expiresAt);
    }

    public long getRemainingSeconds() {
        if (isExpired()) {
            return 0L;
        }
        return Math.max(0L, Duration.between(Instant.now(), this.expiresAt).getSeconds());
    }
}

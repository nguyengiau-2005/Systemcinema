package com.cinema.ticketsystem.entity.cinema;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.cinema.ticketsystem.entity.user.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "bookings")
@Data
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false) // Đảm bảo đơn hàng luôn gắn với 1 user
    private User user;

    @CreationTimestamp // Tự động lưu thời gian tạo đơn ở Backend
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime bookingTime;

    // Đổi sang BigDecimal để tránh sai số khi tính toán tiền tệ
    private java.math.BigDecimal totalPrice = java.math.BigDecimal.ZERO;

    private String discountCode;

    private java.math.BigDecimal discountAmount = java.math.BigDecimal.ZERO;

    // Gán mặc định trạng thái ban đầu là PENDING
    @Column(nullable = false)
    private String paymentStatus = "PENDING"; // PENDING, PAID, CANCELLED

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    @JsonManagedReference(value = "booking-tickets")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Ticket> tickets;

    // Bổ sung thêm mối quan hệ này để lưu thông tin bắp nước/combo (nếu có)
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    @JsonManagedReference(value = "booking-foods")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<BookingFood> bookingFoods;

    // Mã đơn hàng do hệ thống tự sinh ra (VD: DH10293)
    // Dùng cái này làm nội dung chuyển khoản cho khách
    @PrePersist
    public void ensureOrderCode() {
        if (orderCode == null || orderCode.isBlank()) {
            orderCode = "DH" + System.currentTimeMillis() + ((int) (Math.random() * 900) + 100);
        }
    }

    @Column(unique = true, nullable = false, length = 20)
    private String orderCode;

    // Mã giao dịch từ ngân hàng bắn về (Để chống trùng lặp)
    @Column(name = "transaction_reference", length = 50)
    private String transactionReference;

    // Thời điểm thanh toán thành công
    private LocalDateTime paymentTime;
}
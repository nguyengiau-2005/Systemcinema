package com.cinema.ticketsystem.entity.user;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.entity.cinema.Review;
import com.cinema.ticketsystem.entity.loyalty.RewardPointHistory;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password; // Lưu ý: Sẽ được mã hóa BCrypt

    private String fullName;
    private String email;
    private String phone;
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(nullable = false, columnDefinition = "int default 0")
    private Integer loyaltyPoints = 0;

    // Liên kết với bảng membership_tiers để vẽ ERD (Denormalization)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tier_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private com.cinema.ticketsystem.entity.loyalty.MembershipTier membershipTier;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Booking> bookings;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RewardPointHistory> rewardHistories;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Review> reviews;
}


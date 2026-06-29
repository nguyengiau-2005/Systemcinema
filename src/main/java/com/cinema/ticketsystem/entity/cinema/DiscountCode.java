package com.cinema.ticketsystem.entity.cinema;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "discount_codes", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Data
public class DiscountCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;

    /** PERCENTAGE or FIXED */
    private String type;

    private Double value;

    private Boolean active = true;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expirationDate;

    private Integer maxUsage;

    private Integer usedCount = 0;

    private Double minOrderValue;

    // Thêm liên kết vật lý để vẽ ERD
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicable_movie_id", referencedColumnName = "id", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private Movie applicableMovie;

    @Column(name = "applicable_movie_id")
    private Long applicableMovieId;
}

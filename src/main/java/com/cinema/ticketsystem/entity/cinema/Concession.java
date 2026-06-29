package com.cinema.ticketsystem.entity.cinema;

import jakarta.persistence.*;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "concessions")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Concession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    /** Ví dụ: "32oz", "Large", hoặc mô tả ngắn */
    private String size;

    /** Mô tả chi tiết cho client hiển thị: thành phần, vị, v.v. */
    private String description;

    /** DRINK, POPCORN, SNACK, COMBO (nếu cần) */
    @Column(nullable = false)
    private String category;

    private Double price;

    private Boolean active = true;

    // F&B Inventory Management
    @Column(nullable = false)
    private Integer stockQuantity = 100;

    @Column(nullable = false)
    private Integer alertThreshold = 20;
}

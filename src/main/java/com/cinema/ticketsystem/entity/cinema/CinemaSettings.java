package com.cinema.ticketsystem.entity.cinema;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "cinema_settings")
@Data
public class CinemaSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cinema_name")
    private String cinemaName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price")
    private Double basePrice = 100000.0;

    @Column(name = "vip_price")
    private Double vipPrice = 150000.0;

    @Column(name = "student_discount")
    private Integer studentDiscount = 20;

    @Column(name = "senior_discount")
    private Integer seniorDiscount = 30;

    @Column(name = "weekend_surcharge")
    private Double weekendSurcharge = 10.0;

    @Column(name = "holiday_surcharge")
    private Double holidaySurcharge = 20.0;

    @Column(name = "peak_hour_surcharge")
    private Double peakHourSurcharge = 15.0;

    @Column(name = "holiday_dates", columnDefinition = "TEXT")
    private String holidayDates = "01/01,30/04,01/05,02/09";

    // Giảm giá trẻ em (%)
    @Column(name = "child_discount")
    private Integer childDiscount = 0;

    // Ghi chú / Giới thiệu về rạp
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}

package com.cinema.ticketsystem.entity.cinema;

import jakarta.persistence.*;
import lombok.Data;
import com.cinema.ticketsystem.entity.cinema.roles.ShowtimeStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Data
// 🌟 THÊM DÒNG NÀY: Để bảo vệ chính lớp Showtime khi nó được gọi từ các API khác
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Showtime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id")
    // 🌟 SỬA DÒNG NÀY: Thêm "hibernateLazyInitializer" và "handler" vào mảng ignore
    @JsonIgnoreProperties({"showtimes", "hibernateLazyInitializer", "handler"}) 
    private Movie movie;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    // 🌟 THÊM DÒNG NÀY: Phòng trường hợp Room cũng đang bị Lazy Loading ở đâu đó
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Room room;

    @Column(name = "show_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate showDate;

    @JsonProperty("start_time")
    @JsonFormat(pattern = "HH:mm")
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime; 

    @JsonProperty("end_time")
    @JsonFormat(pattern = "HH:mm")
    @Column(name = "end_time")
    private LocalTime endTime; 

    @Column(name = "base_price", nullable = false)
    private Double basePrice; 

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ShowtimeStatus status = ShowtimeStatus.ACTIVE;

    @Column(nullable = false)
    private String format; 

    @OneToMany(mappedBy = "showtime", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ShowtimeSeat> showtimeSeats;
}
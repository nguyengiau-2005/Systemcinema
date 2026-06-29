package com.cinema.ticketsystem.entity;

import com.cinema.ticketsystem.entity.cinema.Movie;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "banner_config")
@Data
public class BannerConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Phim được chọn vào banner - liên kết khóa ngoại đến bảng movies */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_banner_config_movie"))
    private Movie movie;

    /** Thứ tự hiển thị (0, 1, 2, ...) */
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}

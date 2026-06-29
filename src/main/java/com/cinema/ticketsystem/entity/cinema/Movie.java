package com.cinema.ticketsystem.entity.cinema;

import java.time.LocalDate;
import java.util.List;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.springframework.format.annotation.DateTimeFormat;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "movies")
@Data
// 🌟 THÊM DÒNG NÀY: Để Jackson bỏ qua các thuộc tính quản lý Lazy Loading của Hibernate
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title; 

    @Column(name = "description", columnDefinition = "TEXT") 
    private String description;

    private int duration; 
    private String genre; 
    
    @Column(name = "language")
    private String language;

    
    @Column(name = "rating")
    private String rating; 

    @JsonProperty("age_restriction")
    @Column(name = "age_restriction")
    private String ageRestriction; 

    @JsonProperty("release_date")
    @Column(name = "release_date")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) 
    @JsonFormat(pattern = "yyyy-MM-dd") 
    private LocalDate releaseDate; 

    @JsonProperty("end_date")
    @Column(name = "end_date")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) 
    @JsonFormat(pattern = "yyyy-MM-dd") 
    private LocalDate endDate;

    @Column(name = "formats")
    private String formats; // e.g. "2D, 3D, IMAX"

    @Column(name = "average_score")
    private Float averageScore; // e.g. 4.8

    @Column(name = "total_reviews")
    private Integer totalReviews; // e.g. 1500

    @Column(name = "poster_url")
    private String posterUrl; 

    @Column(name = "trailer_url")
    private String trailerUrl; 

    private String director; 

    @Column(columnDefinition = "TEXT")
    private String cast; 

    @JsonProperty("production_company")
    private String productionCompany;

    @JsonProperty("is_hot")
    @Column(name = "is_hot", columnDefinition = "boolean default false")
    private Boolean isHot = false;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"movie", "hibernateLazyInitializer", "handler"}) 
    @OnDelete(action = OnDeleteAction.CASCADE)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Showtime> showtimes;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Review> reviews;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<MovieComment> comments;
}
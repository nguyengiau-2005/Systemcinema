package com.cinema.ticketsystem.entity.cinema;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Data
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;

    @Column(name = "total_rows")
    private int totalRows;

    @Column(name = "total_columns")
    private int totalColumns;

    @Column(name = "base_price")
    private Double basePrice;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @JsonManagedReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Seat> seats = new ArrayList<>();

    @Transient
    public int getTotalSeats() {
        return totalRows * totalColumns;
    }
}
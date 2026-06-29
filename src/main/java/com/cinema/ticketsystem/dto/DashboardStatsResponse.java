package com.cinema.ticketsystem.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardStatsResponse {
    private BigDecimal totalRevenue;
    private String revenueChange;
    private long ticketsSold;
    private String ticketsChange;
    private long totalCustomers;
    private String customersChange;
    private long activeMovies;
    private String activeMoviesChange;

    private List<RevenueData> revenueData;
    private List<MovieTypeData> movieTypeData;
    private List<RecentTransaction> recentTransactions;
    private List<TopMovieData> topMovies;

    @Data
    public static class TopMovieData {
        private String title;
        private BigDecimal revenue;
        
        public TopMovieData(String title, BigDecimal revenue) {
            this.title = title;
            this.revenue = revenue;
        }
    }

    @Data
    public static class RevenueData {
        private String month;
        private BigDecimal revenue;

        public RevenueData(String month, BigDecimal revenue) {
            this.month = month;
            this.revenue = revenue;
        }
    }

    @Data
    public static class MovieTypeData {
        private String name;
        private long value;

        public MovieTypeData(String name, long value) {
            this.name = name;
            this.value = value;
        }
    }

    @Data
    public static class RecentTransaction {
        private String id;
        private String movie;
        private String customer;
        private int seats;
        private BigDecimal price;
        private String status;

        public RecentTransaction(String id, String movie, String customer, int seats, BigDecimal price, String status) {
            this.id = id;
            this.movie = movie;
            this.customer = customer;
            this.seats = seats;
            this.price = price;
            this.status = status;
        }
    }
}

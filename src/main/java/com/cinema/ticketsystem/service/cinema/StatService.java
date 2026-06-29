package com.cinema.ticketsystem.service.cinema;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cinema.ticketsystem.dto.DashboardStatsResponse;
import com.cinema.ticketsystem.dto.RevenueStatsResponse;
import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.repository.cinema.BookingRepository;
import com.cinema.ticketsystem.repository.cinema.MovieRepository;

@Service
public class StatService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MovieRepository movieRepository;

    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse response = new DashboardStatsResponse();

        BigDecimal totalRev = bookingRepository.getTotalRevenue();
        response.setTotalRevenue(totalRev != null ? totalRev : BigDecimal.ZERO);
        response.setRevenueChange("+0%");

        Long tickets = bookingRepository.getTicketsSold();
        response.setTicketsSold(tickets != null ? tickets : 0);
        response.setTicketsChange("+0%");

        Long customers = bookingRepository.getTotalCustomers();
        response.setTotalCustomers(customers != null ? customers : 0);
        response.setCustomersChange("+0%");

        long moviesCount = movieRepository.count();
        response.setActiveMovies(moviesCount);
        response.setActiveMoviesChange("+0");

        // Revenue Data by month for the current year
        int currentYear = LocalDate.now().getYear();
        List<Object[]> monthlyRevRaw = bookingRepository.getRevenueByMonth(currentYear);
        List<DashboardStatsResponse.RevenueData> revDataList = new ArrayList<>();
        
        for (int i = 1; i <= 12; i++) {
            revDataList.add(new DashboardStatsResponse.RevenueData("T" + i, BigDecimal.ZERO));
        }
        
        for (Object[] row : monthlyRevRaw) {
            if (row[0] == null) continue;
            int month = ((Number) row[0]).intValue();
            BigDecimal rev = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            if (month >= 1 && month <= 12) {
                // UI expects millions for the dashboard chart
                BigDecimal revInMillions = rev.divide(new BigDecimal("1000000"), 2, RoundingMode.HALF_UP);
                revDataList.get(month - 1).setRevenue(revInMillions);
            }
        }
        response.setRevenueData(revDataList);

        // Movie Type Data
        List<Object[]> genreRaw = bookingRepository.getMovieGenreShare();
        List<DashboardStatsResponse.MovieTypeData> movieTypeData = genreRaw.stream()
            .map(row -> new DashboardStatsResponse.MovieTypeData(
                row[0] != null ? (String) row[0] : "Khác", 
                row[1] != null ? ((Number) row[1]).longValue() : 0))
            .collect(Collectors.toList());
        response.setMovieTypeData(movieTypeData);

        // Recent Transactions
        List<Booking> recent = bookingRepository.findTop10ByOrderByBookingTimeDesc();
        List<DashboardStatsResponse.RecentTransaction> txList = recent.stream().map(b -> {
            String title = "N/A";
            int count = 0;
            if (b.getTickets() != null && !b.getTickets().isEmpty()) {
                count = b.getTickets().size();
                title = b.getTickets().get(0).getShowtimeSeat().getShowtime().getMovie().getTitle();
            }
            return new DashboardStatsResponse.RecentTransaction(
                b.getOrderCode(),
                title,
                b.getUser().getFullName(),
                count,
                b.getTotalPrice(),
                "PAID".equals(b.getPaymentStatus()) ? "Đã thanh toán" : ("PENDING".equals(b.getPaymentStatus()) ? "Đang chờ" : "Đã hủy")
            );
        }).collect(Collectors.toList());
        response.setRecentTransactions(txList);
        // Top 5 Movies by Revenue
        List<Object[]> movieRevRaw = bookingRepository.getRevenueByMovie();
        List<DashboardStatsResponse.TopMovieData> topMovies = movieRevRaw.stream()
            .limit(5)
            .map(row -> new DashboardStatsResponse.TopMovieData(
                row[0] != null ? row[0].toString() : "Không rõ",
                row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO
            ))
            .collect(Collectors.toList());
        response.setTopMovies(topMovies);

        return response;
    }

    public RevenueStatsResponse getRevenueStats() {
        RevenueStatsResponse response = new RevenueStatsResponse();

        // Monthly Data
        int currentYear = LocalDate.now().getYear();
        List<Object[]> monthlyRevRaw = bookingRepository.getRevenueByMonth(currentYear);
        List<RevenueStatsResponse.MonthlyRevenue> monthlyList = new ArrayList<>();
        
        for (int i = 1; i <= 12; i++) {
            monthlyList.add(new RevenueStatsResponse.MonthlyRevenue("T" + i, BigDecimal.ZERO, 0, BigDecimal.ZERO));
        }

        for (Object[] row : monthlyRevRaw) {
            if (row[0] == null) continue;
            int month = ((Number) row[0]).intValue();
            BigDecimal rev = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            long tix = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            
            if (month >= 1 && month <= 12) {
                BigDecimal avg = tix > 0 ? rev.divide(new BigDecimal(tix), 0, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                monthlyList.set(month - 1, new RevenueStatsResponse.MonthlyRevenue("T" + month, rev, tix, avg));
            }
        }
        response.setMonthlyData(monthlyList);

        // Movie Revenue
        List<Object[]> movieRevRaw = bookingRepository.getRevenueByMovie();
        List<RevenueStatsResponse.MovieRevenue> movieRevList = movieRevRaw.stream()
            .map(row -> new RevenueStatsResponse.MovieRevenue(
                row[0] != null ? row[0].toString() : "Không rõ",
                row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO,
                row[2] != null ? ((Number) row[2]).longValue() : 0L))
            .collect(Collectors.toList());
        response.setMovieRevenue(movieRevList);

        return response;
    }
}

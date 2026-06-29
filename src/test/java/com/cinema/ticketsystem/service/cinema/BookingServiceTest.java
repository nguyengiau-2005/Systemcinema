package com.cinema.ticketsystem.service.cinema;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.cinema.BookingRepository;
import com.cinema.ticketsystem.repository.cinema.ConcessionRepository;
import com.cinema.ticketsystem.repository.cinema.DiscountCodeRepository;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ShowtimeSeatRepository showtimeSeatRepository;

    @Mock
    private DiscountCodeRepository discountCodeRepository;

    @Mock
    private ConcessionRepository concessionRepository;

    @Mock
    private ShowtimeService showtimeService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private ShowtimeSeat testSeat;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testSeat = new ShowtimeSeat();
        testSeat.setId(100L);
        testSeat.setStatus(1); // 1 = Available (Trống)
    }

    @Test
    void createBooking_Success() {
        // Arrange
        when(bookingRepository.findByUserAndPaymentStatus(testUser, "PENDING")).thenReturn(Collections.emptyList());
        when(showtimeSeatRepository.findById(100L)).thenReturn(Optional.of(testSeat));
        when(showtimeService.calculateFinalTicketPrice(any(), any(), any())).thenReturn(75000.0);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Booking result = bookingService.createBooking(testUser, Arrays.asList(100L), null, null, null);

        // Assert
        assertNotNull(result);
        assertEquals("PENDING", result.getPaymentStatus());
        assertEquals(1, result.getTickets().size());
        assertEquals(0, BigDecimal.valueOf(75000).compareTo(result.getTotalPrice()));
        
        // Kiểm tra xem ghế đã được đổi trạng thái sang 3 (Đang giữ / Holding) chưa
        verify(showtimeSeatRepository, times(1)).save(testSeat);
        assertEquals(3, testSeat.getStatus());
    }

    @Test
    void createBooking_SeatAlreadySold_ThrowsException() {
        // Arrange
        testSeat.setStatus(2); // 2 = Sold (Đã bán)
        when(bookingRepository.findByUserAndPaymentStatus(testUser, "PENDING")).thenReturn(Collections.emptyList());
        when(showtimeSeatRepository.findById(100L)).thenReturn(Optional.of(testSeat));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            bookingService.createBooking(testUser, Arrays.asList(100L), null, null, null);
        });

        assertEquals("Ghế đã được bán!", exception.getMessage());
        
        // Verify ghế và đơn hàng không bị lưu xuống DB
        verify(showtimeSeatRepository, never()).save(any());
        verify(bookingRepository, never()).save(any());
    }
}

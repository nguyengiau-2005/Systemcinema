package com.cinema.ticketsystem.service.cinema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinema.ticketsystem.dto.ConcessionItemDTO;
import com.cinema.ticketsystem.dto.SePayWebhookRequest;
import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.entity.cinema.BookingFood;
import com.cinema.ticketsystem.entity.cinema.Concession;
import com.cinema.ticketsystem.entity.cinema.DiscountCode;
import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.entity.cinema.Ticket;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.cinema.BookingRepository;
import com.cinema.ticketsystem.repository.cinema.ConcessionRepository;
import com.cinema.ticketsystem.repository.cinema.DiscountCodeRepository;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;


@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ShowtimeSeatRepository showtimeSeatRepository;
    @Autowired
    private DiscountCodeRepository discountCodeRepository;
    @Autowired
    private ConcessionRepository concessionRepository;
    @Autowired
    private ShowtimeService showtimeService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Booking createBooking(User user, List<Long> showtimeSeatIds, String discountType, String discountCode,
            List<ConcessionItemDTO> bookingFoodRequests) {

        List<Booking> pendingBookings = bookingRepository.findByUserAndPaymentStatus(user, "PENDING");
        for (Booking b : pendingBookings) {
            cancelBooking(b.getId());
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setBookingTime(LocalDateTime.now());
        booking.setPaymentStatus("PENDING");

        BigDecimal total = BigDecimal.ZERO;
        List<Ticket> tickets = new ArrayList<>();
        List<BookingFood> bookingFoods = new ArrayList<>();

        String effectiveDiscountType = (discountCode != null && !discountCode.isBlank()) ? null : discountType;

        for (Long showtimeSeatId : showtimeSeatIds) {
            ShowtimeSeat showtimeSeat = showtimeSeatRepository.findById(showtimeSeatId)
                    .orElseThrow(() -> new RuntimeException("ID ghế " + showtimeSeatId + " không tồn tại!"));

            if (showtimeSeat.getStatus() == 2) {
                throw new RuntimeException("Ghế đã được bán!");
            }

            double ticketPrice = showtimeService.calculateFinalTicketPrice(showtimeSeat.getShowtime(),
                    showtimeSeat.getSeat(), effectiveDiscountType);
            total = total.add(BigDecimal.valueOf(ticketPrice));

            Ticket ticket = new Ticket();
            ticket.setBooking(booking);
            ticket.setShowtimeSeat(showtimeSeat);
            ticket.setPrice(ticketPrice);
            ticket.setTicketCode(UUID.randomUUID().toString());
            ticket.setStatus("ACTIVE");
            tickets.add(ticket);

            showtimeSeat.setStatus(3); // Holding
            showtimeSeatRepository.save(showtimeSeat);
        }

        // Xử lý đồ ăn kèm
        if (bookingFoodRequests != null) {
            for (ConcessionItemDTO foodRequest : bookingFoodRequests) {
                Concession concession = concessionRepository.findById(foodRequest.getConcessionId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

                BookingFood bookingFood = new BookingFood();
                bookingFood.setBooking(booking);
                bookingFood.setConcession(concession);
                bookingFood.setQuantity(foodRequest.getQuantity() <= 0 ? 1 : foodRequest.getQuantity());
                bookingFood.setPriceAtBooking(BigDecimal.valueOf(concession.getPrice()));
                bookingFoods.add(bookingFood);
                total = total
                        .add(bookingFood.getPriceAtBooking().multiply(BigDecimal.valueOf(bookingFood.getQuantity())));
            }
        }

        // Xử lý mã giảm giá
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (discountCode != null && !discountCode.isBlank()) {
            DiscountCode code = discountCodeRepository.findByCodeIgnoreCaseAndActiveTrue(discountCode)
                    .orElseThrow(() -> new RuntimeException("Mã không hợp lệ"));

            if (code.getExpirationDate() != null && code.getExpirationDate().isBefore(java.time.LocalDate.now())) {
                throw new RuntimeException("Mã giảm giá đã hết hạn");
            }
            if (code.getMaxUsage() != null && code.getUsedCount() >= code.getMaxUsage()) {
                throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
            }
            if (code.getMinOrderValue() != null && total.compareTo(BigDecimal.valueOf(code.getMinOrderValue())) < 0) {
                throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu (" + code.getMinOrderValue() + "đ) để áp dụng mã này");
            }
            if (code.getApplicableMovieId() != null) {
                boolean isApplicable = tickets.stream().allMatch(t -> 
                    t.getShowtimeSeat().getShowtime().getMovie().getId().equals(code.getApplicableMovieId())
                );
                if (!isApplicable) {
                    throw new RuntimeException("Mã giảm giá này không áp dụng cho bộ phim bạn chọn");
                }
            }

            if ("PERCENT".equalsIgnoreCase(code.getType()) || "PERCENTAGE".equalsIgnoreCase(code.getType())) {
                discountAmount = total.multiply(BigDecimal.valueOf(code.getValue()).divide(BigDecimal.valueOf(100)));
            } else {
                discountAmount = BigDecimal.valueOf(code.getValue());
            }
            code.setUsedCount(code.getUsedCount() + 1);
            discountCodeRepository.save(code);
            booking.setDiscountCode(code.getCode());
        }

        booking.setDiscountAmount(discountAmount);
        booking.setTickets(tickets);
        booking.setBookingFoods(bookingFoods);
        
        // Làm tròn số tiền về phần nguyên để tránh lệch số thập phân giữa QR Code và Webhook SePay
        BigDecimal finalPrice = total.subtract(discountAmount).max(BigDecimal.ZERO);
        booking.setTotalPrice(finalPrice.setScale(0, java.math.RoundingMode.HALF_UP));

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại!"));

        booking.setPaymentStatus("PAID");
        booking.setPaymentTime(LocalDateTime.now());

        for (Ticket ticket : booking.getTickets()) {
            ShowtimeSeat showtimeSeat = ticket.getShowtimeSeat();
            showtimeSeat.setStatus(2); // Booked
            showtimeSeatRepository.save(showtimeSeat);
        }
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Bắn sự kiện qua WebSocket cho kênh Admin
        try {
            messagingTemplate.convertAndSend("/topic/admin/dashboard", 
                Map.of("type", "NEW_BOOKING", "bookingId", savedBooking.getId(), "amount", savedBooking.getTotalPrice())
            );
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo WebSocket: " + e.getMessage());
        }
        
        return savedBooking;
    }

    @Transactional
    public String cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy!"));
        bookingRepository.delete(booking);
        return "Đã hủy!";
    }

    @Transactional
    public Long handleWebhookPayment(SePayWebhookRequest payload) {
        String codeFromSePay = payload.getCode();
        BigDecimal amountPaid = BigDecimal.valueOf(payload.getTransferAmount());
        String referenceCode = payload.getReferenceCode();

        // 1. Bộ lọc Demo cho mã SEPAYTEST
        if ("SEPAYTEST".equals(codeFromSePay)) {
            System.out.println(">>> MÔ PHỎNG TEST, BỎ QUA KIỂM TRA DB.");
            return 32L; // Trả về ID giả lập để demo SSE
        }

        // 2. Xử lý chính
        Booking booking = bookingRepository.findFirstByOrderCodeStartingWith(codeFromSePay)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng bắt đầu bằng: " + codeFromSePay));

        if ("PAID".equals(booking.getPaymentStatus()))
            return booking.getId();

        if (amountPaid.compareTo(booking.getTotalPrice()) < 0) {
            throw new RuntimeException("Số tiền thanh toán thiếu!");
        }

        confirmBooking(booking.getId());
        booking.setTransactionReference(referenceCode);
        bookingRepository.save(booking);

        System.out.println("Gạch nợ thành công cho đơn: " + booking.getId());
        return booking.getId();
    }
}
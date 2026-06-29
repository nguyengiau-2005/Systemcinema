package com.cinema.ticketsystem.controller.cinema;

// Sửa lại cho đúng tên class cụ thể
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.ticketsystem.dto.BookingDetailsResponse;
import com.cinema.ticketsystem.dto.ConcessionItemDTO;
import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.entity.cinema.Seat;
import com.cinema.ticketsystem.entity.cinema.Showtime;
import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.entity.cinema.Ticket;
import com.cinema.ticketsystem.entity.user.Role;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.cinema.BookingRepository;
import com.cinema.ticketsystem.service.cinema.BookingService;
import com.cinema.ticketsystem.service.jwt.AuthService;
import com.cinema.ticketsystem.service.payment.PaymentService;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AuthService authService;
    @Autowired
    private BookingService bookingService;
    @Autowired
    private PaymentService paymentService;

    // 1. Lấy danh sách booking của user hiện tại
    @GetMapping("/my")
    public List<Booking> getMyBookings() {
        User currentUser = authService.getCurrentUser();
        return bookingRepository.findByUserIdOrderByBookingTimeDesc(currentUser.getId());
    }

    // 2. Lấy tất cả booking (chỉ admin)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // 2b. Lấy N booking gần nhất đã thanh toán (cho Notification Center)
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<?> getRecentBookings(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int limit) {
        try {
            List<Booking> all = bookingRepository.findAll().stream()
                    .filter(b -> "PAID".equals(b.getPaymentStatus()) || "PRINTED".equals(b.getPaymentStatus()))
                    .sorted((a, bk) -> {
                        java.time.LocalDateTime ta = a.getPaymentTime() != null ? a.getPaymentTime() : a.getBookingTime();
                        java.time.LocalDateTime tb = bk.getPaymentTime() != null ? bk.getPaymentTime() : bk.getBookingTime();
                        if (ta == null && tb == null) return 0;
                        if (ta == null) return 1;
                        if (tb == null) return -1;
                        return tb.compareTo(ta);
                    })
                    .limit(limit)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(all);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    // 3. Lấy chi tiết booking theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại!"));

        User currentUser = authService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.EMPLOYEE && !booking.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Bạn không có quyền xem booking này!");
        }

        BookingDetailsResponse.MovieDto movieDto = booking.getTickets().stream()
                .findFirst()
                .map(ticket -> ticket.getShowtimeSeat().getShowtime().getMovie())
                .map(movie -> new BookingDetailsResponse.MovieDto(movie.getId(), movie.getTitle(), movie.getPosterUrl()))
                .orElse(null);

        ShowtimeSeat firstSeat = booking.getTickets().stream()
                .findFirst()
                .map(Ticket::getShowtimeSeat)
                .orElse(null);

        Showtime showtimeEntity = firstSeat != null ? firstSeat.getShowtime() : null;
        BookingDetailsResponse.ShowtimeDto showtimeDto = showtimeEntity != null ? new BookingDetailsResponse.ShowtimeDto(
                showtimeEntity.getRoom() != null ? showtimeEntity.getRoom().getName() : null,
                showtimeEntity.getFormat(),
                showtimeEntity.getShowDate() != null ? showtimeEntity.getShowDate().toString() : null,
                showtimeEntity.getStartTime() != null ? showtimeEntity.getStartTime().toString() : null
        ) : null;

        List<BookingDetailsResponse.SeatDto> seatDtos = booking.getTickets().stream()
                .map(ticket -> {
                    ShowtimeSeat showtimeSeat = ticket.getShowtimeSeat();
                    Seat seat = showtimeSeat != null ? showtimeSeat.getSeat() : null;
                    return new BookingDetailsResponse.SeatDto(
                            seat != null ? seat.getId() : null,
                            seat != null ? seat.getSeatNumber() : null
                    );
                })
                .collect(Collectors.toList());

        BookingDetailsResponse.CustomerInfoDto customerInfoDto = new BookingDetailsResponse.CustomerInfoDto(
                booking.getUser() != null ? booking.getUser().getFullName() : null,
                booking.getUser() != null ? booking.getUser().getEmail() : null,
                booking.getUser() != null ? booking.getUser().getPhone() : null
        );

        BookingDetailsResponse bookingDetails = new BookingDetailsResponse();
        bookingDetails.setId(booking.getId());
        bookingDetails.setBookingCode(booking.getOrderCode());
        bookingDetails.setStatus(booking.getPaymentStatus());
        bookingDetails.setTotalAmount(booking.getTotalPrice());
        bookingDetails.setCreatedAt(booking.getBookingTime() != null ? booking.getBookingTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null);
        bookingDetails.setMovie(movieDto);
        bookingDetails.setShowtime(showtimeDto);
        bookingDetails.setSeats(seatDtos);
        bookingDetails.setCustomerInfo(customerInfoDto);

        return ResponseEntity.ok(bookingDetails);
    }

    // 4. Hủy booking (chỉ user sở hữu và trạng thái PENDING)
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Booking không tồn tại!"));

            User currentUser = authService.getCurrentUser();
            if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.EMPLOYEE && !booking.getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403).body("Bạn không có quyền hủy booking này!");
            }

            String message = bookingService.cancelBooking(id);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // @Transactional
    @PostMapping("/create")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> request) {
        try {
            User currentUser = authService.getCurrentUser();

            // 1. XỬ LÝ AN TOÀN DANH SÁCH GHẾ (Tránh lỗi ClassCastException Integer -> Long)
            List<?> rawSeatIds = (List<?>) request.get("showtimeSeatIds");
            List<Long> showtimeSeatIds = new java.util.ArrayList<>();

            if (rawSeatIds != null) {
                for (Object idObj : rawSeatIds) {
                    if (idObj instanceof Number number) {
                        showtimeSeatIds.add(number.longValue());
                    } else if (idObj instanceof String str) {
                        // Đề phòng trường hợp Frontend gửi lên dạng chuỗi ["1", "2"]
                        showtimeSeatIds.add(Long.valueOf(str));
                    }
                }
            }

            if (showtimeSeatIds.isEmpty()) {
                return ResponseEntity.badRequest().body("Danh sách ghế không được trống!");
            }

            // 2. Lấy loại giảm giá / mã giảm giá (nếu có)
            String discountType = (String) request.get("discountType");
            String discountCode = (String) request.get("discountCode");

            // 3. XỬ LÝ BẮP NƯỚC (Đoạn này của bạn đã xử lý rất chuẩn)
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> bookingFoodMaps = (List<Map<String, Object>>) request.get("bookingFoods");
            List<ConcessionItemDTO> bookingFoodRequests = new java.util.ArrayList<>();

            if (bookingFoodMaps != null) {
                for (Map<String, Object> foodMap : bookingFoodMaps) {
                    if (foodMap == null)
                        continue;
                    Number concessionIdNumber = (Number) foodMap.get("concessionId");
                    Long concessionId = concessionIdNumber == null ? null : concessionIdNumber.longValue();
                    Number quantityNumber = (Number) foodMap.get("quantity");
                    Integer quantity = quantityNumber == null ? 1 : quantityNumber.intValue();

                    if (concessionId != null) {
                        ConcessionItemDTO item = new ConcessionItemDTO();
                        item.setConcessionId(concessionId);
                        item.setQuantity(quantity);
                        bookingFoodRequests.add(item);
                    }
                }
            }

            // 4. Sử dụng BookingService để tạo booking
            Booking savedBooking = bookingService.createBooking(currentUser, showtimeSeatIds, discountType,
                    discountCode, bookingFoodRequests);

            return ResponseEntity.ok(savedBooking);

        } catch (RuntimeException e) {
            // In ra log console trên Server để dễ debug nếu có lỗi khác
            System.err.println(e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống khi tạo đơn hàng: " + e.getMessage());
        }
    }

    // =====================================================
    // NEW ENDPOINT: Lấy SePay QR Code để thanh toán
    // =====================================================
    @GetMapping("/{id}/qr-payment")
    public ResponseEntity<?> getSePayQrCode(@PathVariable Long id) {
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Booking không tồn tại!"));

            User currentUser = authService.getCurrentUser();
            if (!booking.getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.EMPLOYEE) {
                return ResponseEntity.status(403).body("Bạn không có quyền xem QR thanh toán này!");
            }

            if (!"PENDING".equals(booking.getPaymentStatus())) {
                return ResponseEntity.badRequest().body("Booking này đã được thanh toán hoặc đã bị hủy!");
            }

            // Gọi PaymentService để generate SePay QR Code
            com.cinema.ticketsystem.dto.QrCodeResponse qrResponse = paymentService.generateSePayQrCode(
                    booking.getId(),
                    booking.getOrderCode(),
                    booking.getTotalPrice().doubleValue()
            );

            return ResponseEntity.ok(qrResponse);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return ResponseEntity.status(500).body("Lỗi tạo QR code: " + e.getMessage());
        }
    }

    @Transactional
    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Booking không tồn tại!"));

            if (!"PENDING".equals(booking.getPaymentStatus())) {
                return ResponseEntity.badRequest().body("Booking không ở trạng thái PENDING!");
            }

            // Xử lý thanh toán (giả lập)
            boolean paymentSuccess = paymentService.processPayment(booking.getTotalPrice().doubleValue(), "MoMo"); // Hoặc
                                                                                                                   // VNPay
            if (!paymentSuccess) {
                return ResponseEntity.badRequest().body("Thanh toán thất bại!");
            }

            // Sử dụng BookingService để xác nhận booking
            Booking savedBooking = bookingService.confirmBooking(id);

            // TODO: Gửi QR Code/Email cho khách (thêm service gửi mail)

            return ResponseEntity.ok(savedBooking);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // =====================================================
    // ENDPOINTS CHO EMPLOYEE (SOÁT VÉ TẠI QUẦY)
    // =====================================================

    @GetMapping("/code/{orderCode}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'EMPLOYEE', 'ROLE_EMPLOYEE')")
    public ResponseEntity<?> getBookingByCode(@PathVariable String orderCode) {
        Booking booking = bookingRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + orderCode));

        BookingDetailsResponse.MovieDto movieDto = booking.getTickets().stream()
                .findFirst()
                .map(ticket -> ticket.getShowtimeSeat().getShowtime().getMovie())
                .map(movie -> new BookingDetailsResponse.MovieDto(movie.getId(), movie.getTitle(), movie.getPosterUrl()))
                .orElse(null);

        ShowtimeSeat firstSeat = booking.getTickets().stream()
                .findFirst()
                .map(Ticket::getShowtimeSeat)
                .orElse(null);

        Showtime showtimeEntity = firstSeat != null ? firstSeat.getShowtime() : null;
        BookingDetailsResponse.ShowtimeDto showtimeDto = showtimeEntity != null ? new BookingDetailsResponse.ShowtimeDto(
                showtimeEntity.getRoom() != null ? showtimeEntity.getRoom().getName() : null,
                showtimeEntity.getFormat(),
                showtimeEntity.getShowDate() != null ? showtimeEntity.getShowDate().toString() : null,
                showtimeEntity.getStartTime() != null ? showtimeEntity.getStartTime().toString() : null
        ) : null;

        List<BookingDetailsResponse.SeatDto> seatDtos = booking.getTickets().stream()
                .map(ticket -> {
                    ShowtimeSeat showtimeSeat = ticket.getShowtimeSeat();
                    Seat seat = showtimeSeat != null ? showtimeSeat.getSeat() : null;
                    return new BookingDetailsResponse.SeatDto(
                            seat != null ? seat.getId() : null,
                            seat != null ? seat.getSeatNumber() : null
                    );
                })
                .collect(Collectors.toList());

        BookingDetailsResponse.CustomerInfoDto customerInfoDto = new BookingDetailsResponse.CustomerInfoDto(
                booking.getUser() != null ? booking.getUser().getFullName() : null,
                booking.getUser() != null ? booking.getUser().getEmail() : null,
                booking.getUser() != null ? booking.getUser().getPhone() : null
        );

        BookingDetailsResponse bookingDetails = new BookingDetailsResponse();
        bookingDetails.setId(booking.getId());
        bookingDetails.setBookingCode(booking.getOrderCode());
        bookingDetails.setStatus(booking.getPaymentStatus());
        bookingDetails.setTotalAmount(booking.getTotalPrice());
        bookingDetails.setCreatedAt(booking.getBookingTime() != null ? booking.getBookingTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null);
        bookingDetails.setMovie(movieDto);
        bookingDetails.setShowtime(showtimeDto);
        bookingDetails.setSeats(seatDtos);
        bookingDetails.setCustomerInfo(customerInfoDto);

        return ResponseEntity.ok(bookingDetails);
    }

    @Transactional
    @PutMapping("/code/{orderCode}/print")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'EMPLOYEE', 'ROLE_EMPLOYEE')")
    public ResponseEntity<?> printTicketByCode(@PathVariable String orderCode) {
        try {
            Booking booking = bookingRepository.findByOrderCode(orderCode)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + orderCode));

            if (!"PAID".equals(booking.getPaymentStatus())) {
                return ResponseEntity.badRequest().body("Chỉ có thể in vé cho đơn hàng đã thanh toán (PAID)!");
            }

            booking.setPaymentStatus("PRINTED"); // Cập nhật trạng thái thành PRINTED (Đã soát vé)
            bookingRepository.save(booking);

            return ResponseEntity.ok("Xác nhận in vé thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
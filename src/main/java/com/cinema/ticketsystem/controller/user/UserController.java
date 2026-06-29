package com.cinema.ticketsystem.controller.user;

import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.entity.user.Role;
import com.cinema.ticketsystem.service.user.UserService;
import com.cinema.ticketsystem.service.jwt.AuthService;
import com.cinema.ticketsystem.repository.cinema.BookingRepository;
import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.service.cinema.CloudinaryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/users") // Thêm /api để khớp hoàn toàn với cấu hình axiosClient dưới Frontend
@CrossOrigin(origins = "*")   // Cấp quyền CORS giúp React (port 3000) gọi sang không bị chặn
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private CloudinaryService cloudinaryService;

    /**
     * API lấy toàn bộ danh sách thành viên (Khách hàng & Admin)
     * Endpoint: GET http://localhost:8080/api/users
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Bảo mật: Chỉ tài khoản Admin mới được phép gọi API này
    public ResponseEntity<List<User>> getAllUsers() {
        // Gọi tầng nghiệp vụ ServiceImpl để lấy dữ liệu từ MySQL
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * API lấy thông tin profile của user hiện tại (Tính toán điểm, vé, phim...)
     * Endpoint: GET http://localhost:8080/api/users/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        User currentUser = authService.getCurrentUser();
        
        // Lấy danh sách các đơn hàng đã thanh toán thành công (PAID) để tính điểm và các thống kê
        List<Booking> paidBookings = bookingRepository.findByUserAndPaymentStatus(currentUser, "PAID");
        
        BigDecimal totalSpent = BigDecimal.ZERO;
        int ticketsCount = 0;
        
        for (Booking booking : paidBookings) {
            totalSpent = totalSpent.add(booking.getTotalPrice());
            if (booking.getTickets() != null) {
                ticketsCount += booking.getTickets().size();
            }
        }
        
        // Tính điểm thưởng: 1 điểm cho mỗi 10.000 VNĐ đã chi tiêu cộng điểm kiếm được từ game
        int pointsFromSpent = totalSpent.divide(BigDecimal.valueOf(10000), 0, java.math.RoundingMode.DOWN).intValue();
        int extraPoints = currentUser.getLoyaltyPoints() != null ? currentUser.getLoyaltyPoints() : 0;
        int points = pointsFromSpent + extraPoints;
        
        // Tính hạng thành viên dựa trên điểm
        String membershipLevel = "Silver";
        if (points >= 3000) {
            membershipLevel = "Platinum";
        } else if (points >= 1000) {
            membershipLevel = "Gold";
        }
        
        // Đếm số phim đã xem (phim duy nhất dựa trên movieId)
        long moviesCount = paidBookings.stream()
                .filter(b -> b.getTickets() != null)
                .flatMap(b -> b.getTickets().stream())
                .filter(t -> t.getShowtimeSeat() != null && t.getShowtimeSeat().getShowtime() != null && t.getShowtimeSeat().getShowtime().getMovie() != null)
                .map(t -> t.getShowtimeSeat().getShowtime().getMovie().getId())
                .distinct()
                .count();
                
        // Trả về dữ liệu profile dạng JSON
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", currentUser.getId());
        profile.put("username", currentUser.getUsername());
        profile.put("fullName", currentUser.getFullName());
        profile.put("email", currentUser.getEmail());
        profile.put("phone", currentUser.getPhone());
        profile.put("avatar", currentUser.getAvatar());
        profile.put("role", currentUser.getRole().toString());
        profile.put("membershipLevel", membershipLevel);
        profile.put("points", points);
        profile.put("totalSpent", totalSpent);
        profile.put("ticketsCount", ticketsCount);
        profile.put("moviesCount", moviesCount);
        profile.put("vouchersCount", 5);
        profile.put("joinDate", "2026-01-01");
        
        return ResponseEntity.ok(profile);
    }

    /**
     * API cập nhật thông tin cá nhân của user hiện tại
     * Endpoint: PUT http://localhost:8080/api/users/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody Map<String, String> request) {
        User currentUser = authService.getCurrentUser();
        
        if (request.containsKey("fullName")) {
            currentUser.setFullName(request.get("fullName"));
        }
        if (request.containsKey("email")) {
            currentUser.setEmail(request.get("email"));
        }
        if (request.containsKey("phone")) {
            currentUser.setPhone(request.get("phone"));
        }
        if (request.containsKey("avatar")) {
            currentUser.setAvatar(request.get("avatar"));
        }
        
        userService.save(currentUser);
        
        return getUserProfile();
    }
    
    /**
     * API upload ảnh avatar cho user
     * Endpoint: POST http://localhost:8080/api/users/avatar
     */
    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            User currentUser = authService.getCurrentUser();
            String avatarUrl = cloudinaryService.uploadImage(file);
            currentUser.setAvatar(avatarUrl);
            userService.save(currentUser);
            Map<String, String> response = new HashMap<>();
            response.put("avatar", avatarUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi upload avatar: " + e.getMessage());
        }
    }

    /**
     * API cập nhật thông tin người dùng (dành cho Admin)
     * Endpoint: PUT http://localhost:8080/api/users/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserByAdmin(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng!");
        }

        if (request.containsKey("fullName")) {
            user.setFullName(request.get("fullName"));
        }
        if (request.containsKey("email")) {
            user.setEmail(request.get("email"));
        }
        if (request.containsKey("phone")) {
            user.setPhone(request.get("phone"));
        }
        if (request.containsKey("role")) {
            try {
                user.setRole(Role.valueOf(request.get("role")));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Vai trò không hợp lệ!");
            }
        }
        
        userService.save(user);
        return ResponseEntity.ok(user);
    }
}
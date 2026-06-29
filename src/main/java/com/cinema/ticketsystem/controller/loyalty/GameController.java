package com.cinema.ticketsystem.controller.loyalty;

import com.cinema.ticketsystem.entity.loyalty.RewardPointHistory;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.loyalty.RewardPointHistoryRepository;
import com.cinema.ticketsystem.service.jwt.AuthService;
import com.cinema.ticketsystem.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Autowired
    private RewardPointHistoryRepository rewardPointHistoryRepository;

    private final Random random = new Random();

    // Điểm thưởng ngẫu nhiên
    private final int[] PRIZES = {10, 20, 50, 100, 200, 300};

    @PostMapping("/spin")
    public ResponseEntity<?> spinWheel() {
        try {
            User currentUser = authService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            // Chọn phần thưởng ngẫu nhiên
            int prizeIndex;
            int roll = random.nextInt(100);
            if (roll < 1) { // 1% chance for 300
                prizeIndex = 5;
            } else { // 99% chance for 10, 20, 50, 100, 200
                prizeIndex = random.nextInt(5);
            }
            int pointsWon = PRIZES[prizeIndex];

            // Cập nhật điểm cho user
            int currentPoints = currentUser.getLoyaltyPoints() != null ? currentUser.getLoyaltyPoints() : 0;
            currentUser.setLoyaltyPoints(currentPoints + pointsWon);
            userService.save(currentUser);

            // Lưu lịch sử
            RewardPointHistory history = new RewardPointHistory();
            history.setUser(currentUser);
            history.setPoints(pointsWon);
            history.setTransactionType("EARNED_FROM_MINIGAME");
            history.setDescription("Trúng thưởng từ Vòng Quay May Mắn");
            history.setDate(LocalDateTime.now());
            rewardPointHistoryRepository.save(history);

            // Trả về kết quả
            Map<String, Object> response = new HashMap<>();
            response.put("pointsWon", pointsWon);
            response.put("totalLoyaltyPoints", currentUser.getLoyaltyPoints());
            response.put("prizeIndex", prizeIndex);
            response.put("message", "Chúc mừng bạn đã trúng " + pointsWon + " điểm!");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getClass().getName());
            error.put("message", e.getMessage());
            
            // Get root cause if any
            Throwable cause = e.getCause();
            if (cause != null) {
                error.put("cause", cause.getClass().getName());
                error.put("causeMessage", cause.getMessage());
            }
            
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard() {
        try {
            List<User> topUsers = userService.getTopGamers();
            
            // Format response (chỉ trả về username, avatar, và points để bảo mật)
            List<Map<String, Object>> response = topUsers.stream().map(u -> {
                Map<String, Object> map = new HashMap<>();
                map.put("username", u.getUsername());
                map.put("avatar", u.getAvatar());
                map.put("points", u.getLoyaltyPoints() != null ? u.getLoyaltyPoints() : 0);
                return map;
            }).toList();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/claim-quest")
    public ResponseEntity<?> claimQuestPoints(@RequestBody Map<String, Integer> request) {
        try {
            User currentUser = authService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            int pointsWon = request.getOrDefault("points", 0);
            if (pointsWon <= 0 || pointsWon > 500) {
                return ResponseEntity.badRequest().body("Invalid points");
            }

            int currentPoints = currentUser.getLoyaltyPoints() != null ? currentUser.getLoyaltyPoints() : 0;
            currentUser.setLoyaltyPoints(currentPoints + pointsWon);
            userService.save(currentUser);

            RewardPointHistory history = new RewardPointHistory();
            history.setUser(currentUser);
            history.setPoints(pointsWon);
            history.setTransactionType("EARNED_FROM_QUEST");
            history.setDescription("Nhận thưởng hoàn thành Nhiệm vụ Hàng ngày");
            history.setDate(LocalDateTime.now());
            rewardPointHistoryRepository.save(history);

            Map<String, Object> response = new HashMap<>();
            response.put("pointsWon", pointsWon);
            response.put("totalLoyaltyPoints", currentUser.getLoyaltyPoints());
            response.put("message", "Đã nhận " + pointsWon + " điểm!");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}

package com.cinema.ticketsystem.repository.user;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cinema.ticketsystem.entity.user.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    //tìm kiếm findByEmail
    Optional<User> findByEmail(String email);
    //lay tat ca danh sach user
    List<User> findAll();

    // Lấy top 10 user điểm cao nhất cho bảng xếp hạng
    List<User> findTop10ByOrderByLoyaltyPointsDesc();
}

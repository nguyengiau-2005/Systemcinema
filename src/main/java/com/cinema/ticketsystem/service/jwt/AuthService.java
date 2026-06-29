package com.cinema.ticketsystem.service.jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cinema.ticketsystem.entity.user.Role;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.user.UserRepository;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    public String register(User user) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Tên đăng nhập không được để trống");
        }
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống");
        }
        if (user.getPhone() == null || !user.getPhone().matches("\\d{10}")) {
            throw new RuntimeException("Số điện thoại phải bao gồm đúng 10 chữ số");
        }
        if (user.getPassword() == null || user.getPassword().length() < 6) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 6 ký tự");
        }
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        // Mã hóa mật khẩu trước khi lưu
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Nếu không gửi role từ Postman, mặc định là CUSTOMER
        if (user.getRole() == null) {
            user.setRole(Role.CUSTOMER);
        }

        userRepository.save(user);
        return "Đăng ký thành công!";
    }

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Sai tên đăng nhập hoặc mật khẩu"));

        if (passwordEncoder.matches(password, user.getPassword())) {
            // Truyền cả object user vào để JwtService lấy được Role nhồi vào Token
            return jwtService.generateToken(user);
        } else {
            throw new RuntimeException("Sai tên đăng nhập hoặc mật khẩu");
        }
    }

    public User getCurrentUser() {
        String username = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
    }
}
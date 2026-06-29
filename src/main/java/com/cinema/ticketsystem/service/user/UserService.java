package com.cinema.ticketsystem.service.user;

import com.cinema.ticketsystem.entity.user.User;
import java.util.List;

public interface UserService {
    User findByEmail(String email);
    List<User> findAll();
    User save(User user);
    User findById(Long id);
    List<User> getTopGamers();
}
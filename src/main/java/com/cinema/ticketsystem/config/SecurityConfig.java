package com.cinema.ticketsystem.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Bỏ qua bảo mật hoàn toàn cho Webhook, SSE và WebSocket để tránh mọi xung đột bảo mật
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
                "/api/webhook/**",
                "/api/notifications/**",
                "/ws-cinema/**");
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/movies", "/api/movies/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/showtimes", "/api/showtimes/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/showtime-seats/showtime/**").permitAll()
                        .requestMatchers("/api/auth/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/admin/stats/**").permitAll()
                        .requestMatchers("/api/admin/loyalty/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/settings").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/banner-config").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/discount-codes/public").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/snacks", "/api/snacks/**").permitAll()
                        .requestMatchers("/api/age-ratings").permitAll()
                        .requestMatchers("/api/movies/add", "/api/rooms/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                        // Các đường dẫn này đã được webSecurityCustomizer bỏ qua, để đây chỉ là dự phòng
                        .requestMatchers("/api/webhook/**", "/api/notifications/**", "/ws-cinema/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control", "Accept", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        // Expose header để trình duyệt có thể xử lý các phản hồi từ SSE và các header tùy chỉnh
        configuration.setExposedHeaders(List.of("Content-Type", "Cache-Control"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
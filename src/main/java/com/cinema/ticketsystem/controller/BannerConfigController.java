package com.cinema.ticketsystem.controller;

import com.cinema.ticketsystem.entity.BannerConfig;
import com.cinema.ticketsystem.entity.cinema.Movie;
import com.cinema.ticketsystem.repository.BannerConfigRepository;
import com.cinema.ticketsystem.repository.cinema.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Quản lý cấu hình banner trang chủ.
 * GET  /api/banner-config        → public, trả về danh sách phim theo thứ tự đã lưu
 * POST /api/banner-config        → admin only, nhận [{movieId, displayOrder}] để lưu
 */
@RestController
@RequestMapping("/api/banner-config")
@CrossOrigin(origins = "*")
public class BannerConfigController {

    @Autowired
    private BannerConfigRepository bannerConfigRepository;

    @Autowired
    private MovieRepository movieRepository;

    /**
     * Trả về danh sách phim đã được chọn cho banner, theo thứ tự displayOrder.
     * Endpoint public - không cần đăng nhập.
     */
    @GetMapping
    public ResponseEntity<List<Movie>> getBannerMovies() {
        List<BannerConfig> configs = bannerConfigRepository.findAllByOrderByDisplayOrderAsc();
        List<Movie> movies = new ArrayList<>();
        for (BannerConfig config : configs) {
            if (config.getMovie() != null) {
                movies.add(config.getMovie());
            }
        }
        return ResponseEntity.ok(movies);
    }

    /**
     * Lưu cấu hình banner. Chỉ ADMIN được gọi.
     * Body: mảng các ID phim theo thứ tự muốn hiển thị, VD: [3, 7, 1, 5]
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<String> saveBannerConfig(@RequestBody List<Long> movieIds) {
        // Xóa cấu hình cũ
        bannerConfigRepository.deleteAll();

        // Lưu cấu hình mới theo thứ tự
        List<BannerConfig> configs = new ArrayList<>();
        for (int i = 0; i < movieIds.size(); i++) {
            Movie movie = movieRepository.findById(movieIds.get(i)).orElse(null);
            if (movie == null) {
                return ResponseEntity.badRequest()
                        .body("Không tìm thấy phim với ID: " + movieIds.get(i));
            }
            BannerConfig config = new BannerConfig();
            config.setMovie(movie);
            config.setDisplayOrder(i);
            configs.add(config);
        }
        bannerConfigRepository.saveAll(configs);

        return ResponseEntity.ok("Đã lưu cấu hình banner với " + movieIds.size() + " phim.");
    }
}

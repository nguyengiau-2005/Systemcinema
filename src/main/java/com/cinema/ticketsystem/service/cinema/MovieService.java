package com.cinema.ticketsystem.service.cinema;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cinema.ticketsystem.entity.cinema.Movie;
import com.cinema.ticketsystem.repository.cinema.MovieRepository;

@Service
public class MovieService {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private CloudinaryService cloudinaryService; 

    // 1. Lấy toàn bộ danh sách phim
    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    // 1.1. Lấy chi tiết phim theo ID
    public Optional<Movie> getMovieById(Long id) {
        return movieRepository.findById(id);
    }

    // 2. Thêm phim mới kèm xử lý upload poster lên Cloudinary
    public Movie addMovie(Movie movie, MultipartFile file) throws IOException {
        if (file != null && !file.isEmpty()) {
            // Gọi hàm uploadImage từ CloudinaryService của bạn để lấy chuỗi URL
            String imageUrl = cloudinaryService.uploadImage(file);
            movie.setPosterUrl(imageUrl); 
        }
        return movieRepository.save(movie);
    }

    // 3. Cập nhật thông tin phim (Sửa phim)
    public Movie updateMovie(Long id, Movie movieDetails, MultipartFile file) throws IOException {
        Optional<Movie> optionalMovie = movieRepository.findById(id);
        
        if (optionalMovie.isPresent()) {
            Movie existingMovie = optionalMovie.get();
            
            // Map chuẩn xác các thuộc tính theo Entity Movie (Lombok tự sinh)
            existingMovie.setTitle(movieDetails.getTitle());
            existingMovie.setDescription(movieDetails.getDescription());
            existingMovie.setDuration(movieDetails.getDuration());
            existingMovie.setGenre(movieDetails.getGenre());
            existingMovie.setLanguage(movieDetails.getLanguage());
            existingMovie.setRating(movieDetails.getRating());
            existingMovie.setAgeRestriction(movieDetails.getAgeRestriction()); 
            existingMovie.setReleaseDate(movieDetails.getReleaseDate());       
            existingMovie.setEndDate(movieDetails.getEndDate());
            existingMovie.setDirector(movieDetails.getDirector());
            existingMovie.setCast(movieDetails.getCast());
            existingMovie.setProductionCompany(movieDetails.getProductionCompany());
            existingMovie.setTrailerUrl(movieDetails.getTrailerUrl());
            existingMovie.setFormats(movieDetails.getFormats());
            if (movieDetails.getAverageScore() != null) {
                existingMovie.setAverageScore(movieDetails.getAverageScore());
            }
            if (movieDetails.getTotalReviews() != null) {
                existingMovie.setTotalReviews(movieDetails.getTotalReviews());
            }

            // Biện pháp an toàn: Nếu Front-end chọn file ảnh mới thì ghi đè, nếu không giữ nguyên ảnh cũ
            if (file != null && !file.isEmpty()) {
                String imageUrl = cloudinaryService.uploadImage(file);
                existingMovie.setPosterUrl(imageUrl);
            }

            return movieRepository.save(existingMovie);
        } else {
            throw new RuntimeException("Không tìm thấy bộ phim với ID: " + id);
        }
    }

    // 4. Xóa phim
    public void deleteMovie(Long id) {
        if (movieRepository.existsById(id)) {
            movieRepository.deleteById(id);
        } else {
            throw new RuntimeException("Không thể xóa! Không tìm thấy phim với ID: " + id);
        }
    }

    // 5. Lật trạng thái HOT của phim
    public Movie toggleHotStatus(Long id) {
        Movie movie = movieRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với ID: " + id));
        movie.setIsHot(movie.getIsHot() == null || !movie.getIsHot());
        return movieRepository.save(movie);
    }
}
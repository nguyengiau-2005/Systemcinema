package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.DiscountCode;
import com.cinema.ticketsystem.repository.cinema.DiscountCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/discount-codes")
@CrossOrigin(origins = "*")
public class DiscountCodeController {

    @Autowired
    private DiscountCodeRepository discountCodeRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // <--- CHỈ ADMIN MỚI ĐƯỢC XEM
    public List<DiscountCode> getActiveDiscountCodes() {
        return discountCodeRepository.findByActiveTrue();
    }

    // API công khai không cần quyền ADMIN để khách hàng lấy danh sách mã đang hoạt
    // động
    @GetMapping("/public")
    public ResponseEntity<List<DiscountCode>> getPublicDiscountCodes() {
        List<DiscountCode> activeCodes = discountCodeRepository.findByActiveTrue();

        // Bạn có thể lọc thêm: chỉ lấy những mã chưa hết hạn và chưa hết lượt sử dụng
        List<DiscountCode> validCodes = activeCodes.stream().filter(code -> {
            boolean isNotExpired = code.getExpirationDate() == null
                    || !code.getExpirationDate().isBefore(LocalDate.now());
            boolean isNotMaxedOut = code.getMaxUsage() == null || code.getUsedCount() == null
                    || code.getUsedCount() < code.getMaxUsage();
            return isNotExpired && isNotMaxedOut;
        }).toList();

        return ResponseEntity.ok(validCodes);
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<DiscountCode> validateDiscountCode(@PathVariable String code) {
        Optional<DiscountCode> optional = discountCodeRepository.findByCodeIgnoreCaseAndActiveTrue(code);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DiscountCode discountCode = optional.get();
        if (discountCode.getExpirationDate() != null && discountCode.getExpirationDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(null);
        }

        if (discountCode.getMaxUsage() != null && discountCode.getUsedCount() != null
                && discountCode.getUsedCount() >= discountCode.getMaxUsage()) {
            return ResponseEntity.badRequest().body(null);
        }

        return ResponseEntity.ok(discountCode);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountCode> createDiscountCode(@RequestBody DiscountCode discountCode) {
        DiscountCode saved = discountCodeRepository.save(discountCode);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountCode> updateDiscountCode(@PathVariable Long id,
            @RequestBody DiscountCode discountCodeDetails) {
        Optional<DiscountCode> optional = discountCodeRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DiscountCode discountCode = optional.get();
        if (discountCodeDetails.getCode() != null) {
            discountCode.setCode(discountCodeDetails.getCode());
        }
        if (discountCodeDetails.getDescription() != null) {
            discountCode.setDescription(discountCodeDetails.getDescription());
        }
        if (discountCodeDetails.getType() != null) {
            discountCode.setType(discountCodeDetails.getType());
        }
        if (discountCodeDetails.getValue() != null) {
            discountCode.setValue(discountCodeDetails.getValue());
        }
        if (discountCodeDetails.getActive() != null) {
            discountCode.setActive(discountCodeDetails.getActive());
        }
        if (discountCodeDetails.getExpirationDate() != null) {
            discountCode.setExpirationDate(discountCodeDetails.getExpirationDate());
        }
        if (discountCodeDetails.getMaxUsage() != null) {
            discountCode.setMaxUsage(discountCodeDetails.getMaxUsage());
        } else {
            discountCode.setMaxUsage(null);
        }
        
        // Update new fields
        discountCode.setMinOrderValue(discountCodeDetails.getMinOrderValue());
        discountCode.setApplicableMovieId(discountCodeDetails.getApplicableMovieId());

        DiscountCode updated = discountCodeRepository.save(discountCode);
        return ResponseEntity.ok(updated);
    }
}

package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.Combo;
import com.cinema.ticketsystem.entity.cinema.Concession;
import com.cinema.ticketsystem.dto.SnackItem;
import com.cinema.ticketsystem.repository.cinema.ComboRepository;
import com.cinema.ticketsystem.repository.cinema.ConcessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/snacks")
@CrossOrigin(origins = "*")
public class ComboController {

    @Autowired
    private ComboRepository comboRepository;

    @Autowired
    private com.cinema.ticketsystem.service.cinema.ComboService comboService;

    @Autowired
    private ConcessionRepository concessionRepository;

    // 1. Lấy danh sách Combo hoạt động
    @GetMapping("/combos")
    public List<Combo> getCombos() {
        return comboRepository.findByActiveTrue();
    }

    // lấy danh sách snacks lẻ (gồm bắp và đồ uống)
    @GetMapping("/snacks")
    public List<SnackItem> getSnacks() {
        var drinks = concessionRepository.findByCategoryAndActiveTrue("DRINK");
        var popcorns = concessionRepository.findByCategoryAndActiveTrue("POPCORN");

        var result = new java.util.ArrayList<SnackItem>();
        for (Concession d : drinks) {
            result.add(new SnackItem(d.getId(), d.getName(), "DRINK", d.getPrice(), d.getStockQuantity(), d.getAlertThreshold()));
        }
        for (Concession p : popcorns) {
            result.add(new SnackItem(p.getId(), p.getName(), "POPCORN", p.getPrice(), p.getStockQuantity(), p.getAlertThreshold()));
        }
        return result;
    }

    // 2. Lấy danh sách Đồ uống hoạt động
    @GetMapping("/drinks")
    public List<Concession> getDrinks() {
        return concessionRepository.findByCategoryAndActiveTrue("DRINK");
    }

    // 2.b Lấy danh sách Bỏng ngô hoạt động (Bổ sung mới)
    @GetMapping("/popcorns")
    public List<Concession> getPopcorns() {
        return concessionRepository.findByCategoryAndActiveTrue("POPCORN");
    }

    // 3. Thêm mới Combo
    @PostMapping("/combos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Combo> createCombo(@RequestBody Combo combo) {
        Combo saved = comboService.createCombo(combo);
        return ResponseEntity.ok(saved);
    }

    // 4. Thêm mới Đồ uống
    @PostMapping("/drinks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Concession> createDrink(@RequestBody Concession concession) {
        if (concession.getCategory() == null)
            concession.setCategory("DRINK");
        Concession saved = concessionRepository.save(concession);
        return ResponseEntity.ok(saved);
    }

    // 4.b Thêm mới Popcorn
    @PostMapping("/popcorns")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Concession> createPopcorn(@RequestBody Concession concession) {
        if (concession.getCategory() == null)
            concession.setCategory("POPCORN");
        Concession saved = concessionRepository.save(concession);
        return ResponseEntity.ok(saved);
    }

    // 5. Cập nhật Combo theo ID
    @PutMapping("/combos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCombo(@PathVariable Long id, @RequestBody Combo comboDetails) {
        return comboService.updateCombo(id, comboDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/combos/{id}")
    public ResponseEntity<Combo> getComboById(@PathVariable Long id) {
        return comboRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/popcorns/{id}")
    public ResponseEntity<Concession> getPopcornById(@PathVariable Long id) {
        return concessionRepository.findById(id)
                .filter(c -> c.getCategory() != null && c.getCategory().equals("POPCORN"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 6. Cập nhật Đồ uống theo ID
    @PutMapping("/drinks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateDrink(@PathVariable Long id, @RequestBody Concession drinkDetails) {
        Optional<Concession> drinkOptional = concessionRepository.findById(id);

        if (!drinkOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Concession existingDrink = drinkOptional.get();

        if (drinkDetails.getName() != null) {
            existingDrink.setName(drinkDetails.getName());
        }
        // 🔥 BỔ SUNG ĐOẠN NÀY: Cập nhật giá tiền đồ uống nếu Front-end gửi lên
        if (drinkDetails.getPrice() != null) {
            existingDrink.setPrice(drinkDetails.getPrice());
        }
        if (drinkDetails.getActive() != null) {
            existingDrink.setActive(drinkDetails.getActive());
        }
        if (drinkDetails.getDescription() != null) {
            existingDrink.setDescription(drinkDetails.getDescription());
        }
        if (drinkDetails.getStockQuantity() != null) {
            existingDrink.setStockQuantity(drinkDetails.getStockQuantity());
        }
        if (drinkDetails.getAlertThreshold() != null) {
            existingDrink.setAlertThreshold(drinkDetails.getAlertThreshold());
        }

        Concession updatedDrink = concessionRepository.save(existingDrink);
        return ResponseEntity.ok(updatedDrink);
    }

    //
    @GetMapping("/drinks/{id}")
    public ResponseEntity<Concession> getDrinkById(@PathVariable Long id) {
        return concessionRepository.findById(id)
                .filter(c -> c.getCategory() != null && c.getCategory().equals("DRINK"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 7. Cập nhật Bỏng ngô theo ID (Bổ sung mới)
    @PutMapping("/popcorns/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updatePopcorn(@PathVariable Long id, @RequestBody Concession popcornDetails) {
        Optional<Concession> popcornOptional = concessionRepository.findById(id);

        if (!popcornOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Concession existingPopcorn = popcornOptional.get();

        if (popcornDetails.getName() != null) {
            existingPopcorn.setName(popcornDetails.getName());
        }
        if (popcornDetails.getPrice() != null) {
            existingPopcorn.setPrice(popcornDetails.getPrice());
        }
        if (popcornDetails.getSize() != null) {
            existingPopcorn.setSize(popcornDetails.getSize());
        }
        if (popcornDetails.getDescription() != null) {
            existingPopcorn.setDescription(popcornDetails.getDescription());
        }
        if (popcornDetails.getActive() != null) {
            existingPopcorn.setActive(popcornDetails.getActive());
        }
        if (popcornDetails.getStockQuantity() != null) {
            existingPopcorn.setStockQuantity(popcornDetails.getStockQuantity());
        }
        if (popcornDetails.getAlertThreshold() != null) {
            existingPopcorn.setAlertThreshold(popcornDetails.getAlertThreshold());
        }

        Concession updatedPopcorn = concessionRepository.save(existingPopcorn);
        return ResponseEntity.ok(updatedPopcorn);
    }
}
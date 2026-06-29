package com.cinema.ticketsystem.service.cinema;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinema.ticketsystem.entity.cinema.roles.ShowtimeStatus;
import com.cinema.ticketsystem.entity.cinema.Movie;
import com.cinema.ticketsystem.entity.cinema.Room;
import com.cinema.ticketsystem.entity.cinema.Seat;
import com.cinema.ticketsystem.entity.cinema.CinemaSettings;
import com.cinema.ticketsystem.entity.cinema.Showtime;
import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.entity.cinema.Ticket;
import com.cinema.ticketsystem.repository.cinema.MovieRepository;
import com.cinema.ticketsystem.repository.cinema.RoomRepository;
import com.cinema.ticketsystem.repository.cinema.SeatRepository;
import com.cinema.ticketsystem.repository.cinema.ShowtimeRepository;
import com.cinema.ticketsystem.repository.cinema.CinemaSettingsRepository;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;
import com.cinema.ticketsystem.repository.cinema.TicketRepository;
import com.cinema.ticketsystem.dto.AvailableShowtimeSlot;
import com.cinema.ticketsystem.dto.ShowtimeBatchRequest;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShowtimeService {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private CinemaSettingsRepository settingsRepository;

    @Autowired
    private ShowtimeSeatRepository showtimeSeatRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Transactional
    public Showtime createShowtime(Showtime showtime) {
        // 1. Kiểm tra thời gian trong quá khứ
        validateShowtime(showtime);

        // 2. Tính EndTime (LocalDateTime để xử lý suất chiếu xuyên đêm)
        LocalDateTime startDT = LocalDateTime.of(showtime.getShowDate(), showtime.getStartTime());
        int durationPlusCleaning = showtime.getMovie().getDuration() + 15;
        LocalDateTime endDT = startDT.plusMinutes(durationPlusCleaning);

        // Lưu LocalTime vào entity (nếu DB chỉ lưu LocalTime)
        showtime.setEndTime(endDT.toLocalTime());

        // 3. Kiểm tra trùng lịch chiếu trong cùng một phòng
        checkOverlap(showtime.getRoom().getId(), startDT, endDT);

        // 4. Mặc định lấy giá cơ sở từ Cấu hình chung nếu Admin không nhập giá riêng cho Suất chiếu
        if (showtime.getBasePrice() <= 0) {
            CinemaSettings globalSettings = settingsRepository.findById(1L).orElse(null);
            if (globalSettings != null && globalSettings.getBasePrice() != null) {
                showtime.setBasePrice(globalSettings.getBasePrice());
            } else {
                showtime.setBasePrice(showtime.getRoom().getBasePrice());
            }
        }

        return showtimeRepository.save(showtime);
    }

    @Transactional
    public List<Showtime> createShowtimesBatch(ShowtimeBatchRequest request) {
        List<String> startTimes = request.getStartTimes();
        if ((startTimes == null || startTimes.isEmpty()) && request.getStartTime() != null) {
            startTimes = List.of(request.getStartTime());
        }
        if (startTimes == null || startTimes.isEmpty()) {
            throw new RuntimeException("start_time hoặc start_times là bắt buộc");
        }

        List<LocalDate> showDates = request.getShowDates();
        if (showDates == null || showDates.isEmpty()) {
            if (request.getShowDate() != null) {
                showDates = List.of(request.getShowDate());
            } else {
                throw new RuntimeException("showDate hoặc showDates là bắt buộc");
            }
        }

        Movie movie = movieRepository.findById(request.getMovie().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim"));
        Room room = roomRepository.findById(request.getRoom().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu"));

        List<Showtime> savedShowtimes = new ArrayList<>();
        
        for (LocalDate date : showDates) {
            for (String startTimeValue : startTimes) {
                LocalTime startTime = LocalTime.parse(startTimeValue);
                LocalDateTime startDT = LocalDateTime.of(date, startTime);
                
                // Skip if in the past
                if (startDT.isBefore(LocalDateTime.now())) {
                    continue;
                }
                
                int durationPlusCleaning = movie.getDuration() + 15;
                LocalDateTime endDT = startDT.plusMinutes(durationPlusCleaning);
                
                try {
                    // Check overlap first so we can skip without triggering transaction rollback
                    checkOverlap(room.getId(), startDT, endDT);
                } catch (RuntimeException e) {
                    System.out.println("Bỏ qua suất chiếu bị trùng lúc " + startDT);
                    continue; // Skip this specific time slot
                }

                Showtime showtime = new Showtime();
                showtime.setMovie(movie);
                showtime.setRoom(room);
                showtime.setShowDate(date);
                showtime.setStartTime(startTime);
                showtime.setBasePrice(request.getBasePrice() != null ? request.getBasePrice() : 0.0);
                showtime.setFormat(request.getFormat());

                Showtime savedShowtime = createShowtime(showtime);
                createSeatsForShowtime(savedShowtime);
                savedShowtimes.add(savedShowtime);
            }
        }

        if (savedShowtimes.isEmpty() && !showDates.isEmpty() && !startTimes.isEmpty()) {
            throw new RuntimeException("Không thể tạo suất chiếu nào. Có thể do tất cả khung giờ đều trùng lịch hoặc nằm trong quá khứ.");
        }

        return savedShowtimes;
    }

    @Transactional
    public Showtime updateShowtime(Long showtimeId, Showtime request) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new RuntimeException("Suất chiếu không tồn tại"));

        if (request.getMovie() != null && request.getMovie().getId() != null) {
            Movie movie = movieRepository.findById(request.getMovie().getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phim"));
            showtime.setMovie(movie);
        }

        if (request.getRoom() != null && request.getRoom().getId() != null) {
            Room room = roomRepository.findById(request.getRoom().getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu"));
            if (!room.getId().equals(showtime.getRoom().getId())) {
                throw new RuntimeException("Không thể thay đổi phòng chiếu của suất đã tạo");
            }
        }

        if (request.getShowDate() != null) {
            showtime.setShowDate(request.getShowDate());
        }
        if (request.getStartTime() != null) {
            showtime.setStartTime(request.getStartTime());
        }
        if (request.getFormat() != null && !request.getFormat().isBlank()) {
            showtime.setFormat(request.getFormat());
        }
        if (request.getBasePrice() != null) {
            showtime.setBasePrice(request.getBasePrice());
        }

        // Tính lại endTime sau khi sửa startTime / showDate / movie
        LocalDateTime startDT = LocalDateTime.of(showtime.getShowDate(), showtime.getStartTime());
        validateShowtime(showtime);

        int durationPlusCleaning = showtime.getMovie().getDuration() + 15;
        LocalDateTime endDT = startDT.plusMinutes(durationPlusCleaning);
        showtime.setEndTime(endDT.toLocalTime());

        checkOverlap(showtime.getRoom().getId(), startDT, endDT, showtime.getId());

        if (showtime.getBasePrice() == null || showtime.getBasePrice() <= 0) {
            CinemaSettings globalSettings = settingsRepository.findById(1L).orElse(null);
            if (globalSettings != null && globalSettings.getBasePrice() != null) {
                showtime.setBasePrice(globalSettings.getBasePrice());
            } else {
                showtime.setBasePrice(showtime.getRoom().getBasePrice());
            }
        }

        return showtimeRepository.save(showtime);
    }

    private void createSeatsForShowtime(Showtime savedShowtime) {
        List<Seat> physicalSeats = seatRepository.findByRoomId(savedShowtime.getRoom().getId());
        List<ShowtimeSeat> sts = physicalSeats.stream().map(seat -> {
            ShowtimeSeat stSeat = new ShowtimeSeat();
            stSeat.setShowtime(savedShowtime);
            stSeat.setSeat(seat);
            stSeat.setStatus(1); // 1 = Có sẵn (Available)
            return stSeat;
        }).collect(Collectors.toList());
        showtimeSeatRepository.saveAll(sts);
    }

    /**
     * Tính giá vé cuối cùng cho một ghế cụ thể và một đối tượng cụ thể
     * 
     * @param customerType: "STUDENT", "ELDER", "CHILD" hoặc null/default
     */
    public double calculateFinalTicketPrice(Showtime showtime, Seat seat, String customerType) {
        CinemaSettings settings = settingsRepository.findById(1L).orElse(new CinemaSettings());
        double price = showtime.getBasePrice();

        // 1. Phụ phí Giờ cao điểm (18h - 23h)
        int hour = showtime.getStartTime().getHour();
        if (hour >= 18 && hour <= 23 && settings.getPeakHourSurcharge() != null) {
            price += showtime.getBasePrice() * (settings.getPeakHourSurcharge() / 100.0);
        }

        // 2. Phụ phí Ngày Lễ hoặc Cuối tuần
        boolean isHoliday = false;
        String dateStr = String.format("%02d/%02d", showtime.getShowDate().getDayOfMonth(), showtime.getShowDate().getMonthValue());
        if (settings.getHolidayDates() != null && !settings.getHolidayDates().isBlank()) {
            String[] holidays = settings.getHolidayDates().split(",");
            for (String h : holidays) {
                if (h.trim().equals(dateStr)) {
                    isHoliday = true;
                    break;
                }
            }
        }

        if (isHoliday && settings.getHolidaySurcharge() != null) {
            price += showtime.getBasePrice() * (settings.getHolidaySurcharge() / 100.0);
        } else {
            DayOfWeek day = showtime.getShowDate().getDayOfWeek();
            if ((day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) && settings.getWeekendSurcharge() != null) {
                price += showtime.getBasePrice() * (settings.getWeekendSurcharge() / 100.0);
            }
        }

        // 3. Phụ phí Ghế VIP
        if ("VIP".equalsIgnoreCase(seat.getSeatType()) && settings.getVipPrice() != null) {
            // Giá vé VIP trong cấu hình là giá cố định (VD: 150k), ta cộng phần chênh lệch
            double vipDiff = settings.getVipPrice() - settings.getBasePrice();
            if (vipDiff > 0) price += vipDiff;
        }

        // 4. Áp dụng Giảm giá đối tượng (Tính trên tổng giá sau phụ phí)
        double discountRate = 0;
        if ("STUDENT".equalsIgnoreCase(customerType) && settings.getStudentDiscount() != null)
            discountRate = settings.getStudentDiscount() / 100.0;
        else if ("ELDER".equalsIgnoreCase(customerType) && settings.getSeniorDiscount() != null)
            discountRate = settings.getSeniorDiscount() / 100.0;

        price = price * (1 - discountRate);

        return price;
    }

    @Transactional
    public Showtime updateShowtimeStatus(Long showtimeId, ShowtimeStatus newStatus) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new RuntimeException("Suất chiếu không tồn tại"));

        ShowtimeStatus oldStatus = showtime.getStatus();
        showtime.setStatus(newStatus);
        Showtime saved = showtimeRepository.save(showtime);

        // Nếu chuyển sang CANCELLED, thực hiện hủy vé và nhả ghế
        if (newStatus == ShowtimeStatus.CANCELLED && oldStatus != ShowtimeStatus.CANCELLED) {
            cancelShowtime(showtimeId);
        }

        return saved;
    }

    private void cancelShowtime(Long showtimeId) {
        // 1. Lấy tất cả ShowtimeSeat của suất này
        List<ShowtimeSeat> showtimeSeats = showtimeSeatRepository.findByShowtimeId(showtimeId);

        for (ShowtimeSeat stSeat : showtimeSeats) {
            // Nhả ghế: status về 1 (Available) nếu đang HOLDING (3) hoặc BOOKED (2)
            if (stSeat.getStatus() == 3 || stSeat.getStatus() == 2) {
                stSeat.setStatus(1);
                showtimeSeatRepository.save(stSeat);
            }
        }

        // 2. Hủy tất cả vé liên quan
        List<Ticket> tickets = ticketRepository.findByShowtimeId(showtimeId);
        for (Ticket ticket : tickets) {
            ticket.setStatus("CANCELLED");
            ticketRepository.save(ticket);
        }
    }

    private void checkOverlap(Long roomId, LocalDateTime newStart, LocalDateTime newEnd) {
        checkOverlap(roomId, newStart, newEnd, null);
    }

    private void checkOverlap(Long roomId, LocalDateTime newStart, LocalDateTime newEnd, Long excludeShowtimeId) {
        List<Showtime> existingShows = showtimeRepository.findByRoomIdAndShowDate(roomId, newStart.toLocalDate());

        for (Showtime existing : existingShows) {
            if (excludeShowtimeId != null && existing.getId().equals(excludeShowtimeId)) {
                continue;
            }
            LocalDateTime exStart = LocalDateTime.of(existing.getShowDate(), existing.getStartTime());
            LocalDateTime exEnd = LocalDateTime.of(existing.getShowDate(), existing.getEndTime());

            if (newStart.isBefore(exEnd) && newEnd.isAfter(exStart)) {
                throw new RuntimeException(
                        "Phòng chiếu đã có lịch từ " + existing.getStartTime() + " đến " + existing.getEndTime());
            }
        }
    }

    public void validateShowtime(Showtime showtime) {
        LocalDateTime startDateTime = LocalDateTime.of(showtime.getShowDate(), showtime.getStartTime());
        if (startDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Không thể tạo suất chiếu trong quá khứ!");
        }
    }

    public List<Showtime> getShowtimesForCurrentWeek(Long movieId) {
        LocalDate today = LocalDate.now();

        // Tự động tìm ngày Thứ 2 của tuần này
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        // Tự động tìm ngày Chủ Nhật của tuần này
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        // Gọi Repository để lấy đúng danh sách trong khoảng này
        return showtimeRepository.findShowtimesInWeek(movieId, startOfWeek, endOfWeek);
    }

    public List<Showtime> getShowtimesByDate(String dateStr) {
        // Nếu phía Frontend không truyền ngày lên (hoặc bị rỗng)
        // Bạn có thể chọn lấy ngày hôm nay làm mặc định để lọc
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return showtimeRepository.findByShowDateOrderByStartTimeAsc(LocalDate.now());
        }

        // Chuyển đổi chuỗi "YYYY-MM-DD" từ Frontend gửi lên thành kiểu LocalDate trong
        // Java
        LocalDate localDate = LocalDate.parse(dateStr);

        // Gọi xuống DB lấy dữ liệu lên
        return showtimeRepository.findByShowDateOrderByStartTimeAsc(localDate);
    }

    public List<AvailableShowtimeSlot> findAvailableSlots(Long roomId, String dateStr, int durationMinutes) {
        if (roomId == null) {
            throw new RuntimeException("roomId là bắt buộc");
        }
        if (dateStr == null || dateStr.trim().isEmpty()) {
            throw new RuntimeException("date là bắt buộc");
        }
        if (durationMinutes <= 0) {
            throw new RuntimeException("duration phải lớn hơn 0");
        }

        LocalDate date = LocalDate.parse(dateStr);

        // Chỉ lấy các suất chiếu ACTIVE, bỏ qua các suất CANCELLED
        List<Showtime> existingShows = showtimeRepository.findByRoomIdAndShowDateAndStatusOrderByStartTimeAsc(
                roomId, date, ShowtimeStatus.ACTIVE);

        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
        LocalTime dayStart = LocalTime.of(8, 0); // 08:00
        LocalTime dayEnd = LocalTime.of(23, 30); // Giờ kết thúc cho phép của suất chiếu
        int bufferMinutes = 15; // Thời gian dọn dẹp giữa các suất
        List<AvailableShowtimeSlot> result = new ArrayList<>();

        LocalTime windowStart = dayStart;
        LocalTime windowEnd;
        for (Showtime show : existingShows) {
            LocalTime showStart = show.getStartTime();
            LocalTime showEnd = show.getEndTime();

            // Khoảng thời gian trống trước suất hiện tại
            windowEnd = showStart.minusMinutes(bufferMinutes);
            addAvailableSlots(result, formatter, durationMinutes, bufferMinutes, windowStart, windowEnd);

            // Cập nhật con trỏ sang sau suất hiện tại + buffer
            windowStart = showEnd.plusMinutes(bufferMinutes);
            if (windowStart.isAfter(dayEnd)) {
                windowStart = dayEnd;
                break;
            }
        }

        // Khoảng trống cuối ngày sau suất chiếu cuối cùng
        addAvailableSlots(result, formatter, durationMinutes, bufferMinutes, windowStart, dayEnd);

        return result;
    }

    private void addAvailableSlots(List<AvailableShowtimeSlot> result,
                                   java.time.format.DateTimeFormatter formatter,
                                   int durationMinutes,
                                   int bufferMinutes,
                                   LocalTime windowStart,
                                   LocalTime windowEnd) {
        if (windowStart == null || windowEnd == null || !windowStart.isBefore(windowEnd)) {
            return;
        }

        LocalTime latestStart = windowEnd.minusMinutes(durationMinutes);
        if (latestStart.isBefore(windowStart)) {
            return;
        }

        LocalTime slotStart = windowStart;
        while (!slotStart.isAfter(latestStart)) {
            LocalTime slotEnd = slotStart.plusMinutes(durationMinutes);
            result.add(new AvailableShowtimeSlot(slotStart.format(formatter), slotEnd.format(formatter)));
            slotStart = slotStart.plusMinutes(durationMinutes + bufferMinutes);
        }
    }
}
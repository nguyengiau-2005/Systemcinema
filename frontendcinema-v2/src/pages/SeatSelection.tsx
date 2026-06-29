import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, User, X, Info, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosClient from '../api/axiosClient';
import { socketService } from '../utils/socketClient';

// Định danh cho tab/client hiện tại để không bị đè trạng thái ghế do chính mình gửi đi
const CLIENT_ID = Math.random().toString(36).substring(7);

interface Movie {
  id: string;
  title: string;
  poster: string;
  banner: string;
  description: string;
  genre: string;
  rating: string | number;
  duration: number;
  ageRating: string;
  director: string;
  cast: string;
  releaseDate: string;
}

interface Showtime {
  id: string;
  movieId: string;
  time: string;
  date: string;
  theater: string;
  format: string;
  price: number;
}

interface Seat {
  id: string;       // ID của ShowtimeSeat
  seatId: string;   // ID gốc của ghế
  row: string;      // Hàng ghế (A, B, C...)
  number: number;   // Số ghế (1, 2, 3...)
  type: 'standard' | 'vip' | 'couple' | 'reserved';
  status: 'available' | 'selected' | 'taken';
  price: number;
}

export default function SeatSelection() {
  const { movieId, showtimeId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Lấy thông tin chi tiết phim
        if (movieId) {
          const movieResponse = await axiosClient.get(`/movies/${movieId}`) as any;
          const movieData = movieResponse?.data ? movieResponse.data : movieResponse;
          if (movieData) {
            setMovie({
              ...movieData,
              poster: movieData.posterUrl || '',
              banner: movieData.posterUrl || '',
              ageRating: movieData.ageRestriction || 'G',
            });
          }
        }

        // 2. Lấy thông tin suất chiếu
        if (showtimeId) {
          const showtimesResponse = await axiosClient.get('/showtimes') as any;
          const rawShowtimes = Array.isArray(showtimesResponse)
            ? showtimesResponse
            : (showtimesResponse?.data || []);

          const selectedShowtime = rawShowtimes.find((s: any) => String(s.id) === String(showtimeId));
          let currentBasePrice = 50000;

          if (selectedShowtime) {
            currentBasePrice = selectedShowtime.basePrice || 50000;
            setShowtime({
              id: String(selectedShowtime.id),
              movieId: String(selectedShowtime.movie?.id || movieId),
              time: selectedShowtime.start_time || selectedShowtime.startTime || '00:00',
              date: selectedShowtime.showDate || '',
              theater: selectedShowtime.room?.name || `Phòng Chiếu`,
              format: selectedShowtime.format || '2D',
              price: currentBasePrice
            });
          }

          // 3. Lấy sơ đồ ghế suất chiếu
          const seatsResponse = await axiosClient.get(`/showtime-seats/showtime/${showtimeId}`) as any;
          console.debug('[SeatSelection] seatsResponse:', seatsResponse);
          const rawShowtimeSeats = Array.isArray(seatsResponse) ? seatsResponse : (seatsResponse?.data || []);

          // 🌟 Lọc hoặc ép kiểu dữ liệu bỏ ghế couple
          const formattedSeats: Seat[] = rawShowtimeSeats
            .map((ss: any) => {
              const seatObj = ss.seat || {};

              let currentStatus: 'available' | 'selected' | 'taken' = 'available';
              if (ss.status === 2 || ss.status === 3) {
                currentStatus = 'taken';
              } else {
                currentStatus = 'available';
              }

              let currentType: 'standard' | 'vip' | 'couple' | 'reserved' = 'standard';
              const backendType = String(seatObj.seatType || 'STANDARD').toLowerCase();
              if (backendType === 'vip') currentType = 'vip';
              if (backendType === 'couple') currentType = 'couple';
              if (backendType === 'reserved') currentType = 'reserved';

              // Ghế đã hỏng hoặc được đặt trước thì không cho chọn
              if (backendType === 'broken' || backendType === 'reserved') {
                currentStatus = 'taken';
              }

              const basePrice = selectedShowtime?.basePrice || currentBasePrice;
              // Nếu là ghế đôi, tính giá gấp đôi
              const finalPrice = currentType === 'couple' ? basePrice * 2 : basePrice;

              return {
                id: String(ss.id),
                seatId: String(seatObj.id),
                row: seatObj.rowName || 'A',
                number: seatObj.colIndex || 1,
                type: currentType,
                status: currentStatus,
                price: finalPrice
              };
            });
            // Nếu bạn muốn ẨN HOÀN TOÀN không cho hiện ghế đôi lên màn hình, hãy uncomment dòng filter dưới này:
            // .filter((seat: any) => seat.type !== 'couple');

          console.debug('[SeatSelection] formattedSeats:', formattedSeats);
          setSeats(formattedSeats);
        }
      } catch (err: any) {
        console.error("Lỗi chi tiết:", err);
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err.message;
        setError(`[Lỗi hệ thống ${status || 'Kết nối'}]: ${msg}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId && showtimeId) {
      fetchData();
    }
  }, [movieId, showtimeId]);

  // Định danh cho tab/client hiện tại đã được chuyển ra ngoài component (CLIENT_ID)

  // Thiết lập WebSocket
  useEffect(() => {
    if (!showtimeId) return;

    socketService.connect();
    
    // Đợi kết nối thành công rồi subscribe
    const subscription = socketService.subscribe(`/topic/seats/${showtimeId}`, (message) => {
      console.log('Realtime seat update:', message);
      const { seatId, status, clientId: senderId } = message;
      
      // Bỏ qua tin nhắn do chính mình gửi đi để không làm mất trạng thái 'selected'
      if (senderId === CLIENT_ID) {
        return;
      }

      setSeats(prevSeats => 
        prevSeats.map(s => s.id === seatId || s.seatId === String(seatId) 
          ? { ...s, status: status } 
          : s
        )
      );
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
      // Không ngắt kết nối hoàn toàn để dùng cho các trang khác nếu cần, hoặc ngắt nếu chỉ dùng ở đây
    };
  }, [showtimeId]);

  const selectedSeats = seats.filter(s => s.status === 'selected');
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const toggleSeat = async (showtimeSeatId: string) => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      alert('Vui lòng đăng nhập để chọn ghế!');
      navigate('/login');
      return;
    }

    const currentSeat = seats.find(s => s.id === showtimeSeatId);
    if (!currentSeat) return;

    if (currentSeat.status === 'taken') {
      alert("Ghế này đã có người giữ hoặc mua rồi bạn ơi!");
      return;
    }

    const oldStatus = currentSeat.status;
    const newStatus = oldStatus === 'available' ? 'selected' : 'available';

    setSeats(prevSeats =>
      prevSeats.map(s => s.id === showtimeSeatId ? { ...s, status: newStatus } : s)
    );

    // Gửi tín hiệu giữ ghế ngay lập tức cho các tab/client khác qua WebSocket
    socketService.sendMessage(`/app/seats/lock/${showtimeId}`, {
      seatId: currentSeat.id,
      status: newStatus === 'selected' ? 'taken' : 'available',
      clientId: CLIENT_ID
    });
  };

  const handleContinue = async () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      alert('Vui lòng đăng nhập để tiếp tục thanh toán!');
      navigate('/login');
      return;
    }

    if (selectedSeats.length > 0) {
      try {
        // Thực hiện gửi yêu cầu khoá ghế xuống backend khi người dùng thực sự bấm Tiếp Tục
        for (const seat of selectedSeats) {
          await axiosClient.put(`/showtime-seats/hold`, {
            showtimeId: Number(showtimeId),
            seatId: Number(seat.seatId),
          });
          socketService.sendMessage(`/app/seats/lock/${showtimeId}`, {
            seatId: seat.id,
            status: 'taken',
            clientId: CLIENT_ID
          });
        }
      } catch (err) {
        console.error('Lỗi khi gọi API giữ ghế:', err);
        alert('Rất tiếc! Một hoặc nhiều ghế bạn chọn đã có người khác đặt. Vui lòng chọn lại!');
        return;
      }

      navigate('/checkout', {
        state: {
          movie,
          showtime,
          seats: selectedSeats,
          totalPrice,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-gray-800 font-medium">Đang tải sơ đồ phòng chiếu và trạng thái ghế...</p>
      </div>
    );
  }

  if (error || !movie || !showtime) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-600 font-bold text-xl mb-2">Không thể tải thông tin phòng và ghế</p>
        <p className="text-gray-700 text-sm mb-6 bg-red-50 p-3 rounded font-mono border border-red-100 max-w-md break-all">
          {error || "Lý do: Không tìm thấy dữ liệu Phim hoặc Suất chiếu tương ứng."}
        </p>
        <button
          onClick={() => navigate(`/movies/${movieId}`)}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Quay lại trang chi tiết phim
        </button>
      </div>
    );
  }

  const seatsByRow = seats.reduce((acc, seat) => {
    const rowName = seat.row || 'A';
    if (!acc[rowName]) acc[rowName] = [];
    acc[rowName].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  Object.keys(seatsByRow).forEach(row => {
    seatsByRow[row].sort((a, b) => a.number - b.number);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Movie Info Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <button
            onClick={() => navigate(`/movies/${movieId}`)}
            className="flex items-center gap-2 text-gray-800 hover:text-red-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
              <div className="flex flex-wrap gap-4 text-gray-800">
                <span className="bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded text-sm">{movie.ageRating}</span>
                <span>{showtime.theater}</span>
                <span>•</span>
                <span>{showtime.format}</span>
                <span>•</span>
                <span>{showtime.date} - <strong className="text-gray-900">{showtime.time}</strong></span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 overflow-x-auto">
              {/* Screen */}
              <div className="mb-12 max-w-md mx-auto">
                <div className="bg-gradient-to-b from-gray-700 to-gray-400 h-2.5 rounded-t-[100px] shadow-md mb-2"></div>
                <p className="text-center text-gray-600 text-xs tracking-widest font-bold uppercase">Màn Hình Chiếu</p>
              </div>

              {/* Sơ đồ ghế */}
              <div className="space-y-3 mb-8 min-w-[450px]">
                {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center justify-center gap-2">
                    <div className="w-8 text-center font-bold text-gray-600 mr-2">{row}</div>
                    <div className="flex gap-2 justify-center">
                      {rowSeats.map((seat) => {
                        let seatClass = "bg-slate-100 border border-slate-200 text-gray-900 hover:bg-slate-200 w-10";
                        if (seat.type === 'vip') {
                          seatClass = "bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200 w-10";
                        } else if (seat.type === 'couple') {
                          seatClass = "bg-pink-100 border border-pink-300 text-pink-800 hover:bg-pink-200 w-[84px]";
                        } else if (seat.type === 'reserved') {
                          seatClass = "bg-purple-100 border border-purple-300 text-purple-800 w-10";
                        }

                        if (seat.status === 'selected') {
                          seatClass = `${seat.type === 'couple' ? 'w-[84px]' : 'w-10'} bg-gradient-to-br from-red-600 to-orange-500 text-white border-transparent animate-pulse shadow-sm`;
                        } else if (seat.status === 'taken') {
                          seatClass = `${seat.type === 'couple' ? 'w-[84px]' : 'w-10'} bg-gray-300 text-gray-600 border-transparent opacity-40 cursor-not-allowed`;
                        }

                        return (
                          <button
                            key={seat.id}
                            onClick={() => toggleSeat(seat.id)}
                            disabled={seat.status === 'taken'}
                            className={`h-10 rounded-md text-xs font-bold transition-all flex items-center justify-center ${seatClass}`}
                          >
                            {seat.number}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-100 border border-slate-200 rounded-md"></div>
                  <span className="text-xs text-gray-800 font-medium">Thường</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-200 border border-purple-300 rounded-md"></div>
                  <span className="text-xs text-gray-800 font-medium">Đặt trước</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-200 border border-amber-300 rounded-md"></div>
                  <span className="text-xs text-gray-800 font-medium">VIP</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-6 bg-pink-100 border border-pink-300 rounded-md"></div>
                  <span className="text-xs text-gray-800 font-medium">Đôi (Couple)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-orange-500 rounded-md"></div>
                  <span className="text-xs text-gray-800 font-medium">Đang chọn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 opacity-40 rounded-md"></div>
                  <span className="text-xs text-gray-800 font-medium">Đã đặt</span>
                </div>
              </div>

              <details className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-md">
                <summary className="cursor-pointer font-medium">Debug: Raw seats data</summary>
                <pre className="text-xs text-gray-900 mt-2 whitespace-pre-wrap max-h-64 overflow-auto">{JSON.stringify(seats, null, 2)}</pre>
              </details>
            </div>
          </motion.div>

          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4 border-b border-gray-100 pb-2">Thông Tin Đặt Vé</h2>

              {selectedSeats.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-700 mb-2 font-medium">Ghế bạn đã chọn:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map(seat => (
                        <div
                          key={seat.id}
                          className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg"
                        >
                          <span className="font-bold text-red-600">{seat.row}{seat.number}</span>
                          <button
                            onClick={() => toggleSeat(seat.id)}
                            className="text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2 max-h-40 overflow-y-auto">
                    {selectedSeats.map(seat => (
                      <div key={seat.id} className="flex justify-between text-sm">
                        <span className="text-gray-800 font-medium">
                          Ghế {seat.row}{seat.number} <span className="text-xs text-gray-600">({seat.type.toUpperCase()})</span>
                        </span>
                        <span className="font-semibold text-gray-800">{seat.price.toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-900">Tổng cộng:</span>
                      <span className="font-black text-2xl text-red-600">
                        {totalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <button
                      onClick={handleContinue}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
                    >
                      Tiếp Tục Thanh Toán
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm font-medium">Vui lòng nhấp chọn ghế trên sơ đồ rạp để bắt đầu</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Lưu ý khi chọn ghế rạp chiếu</h3>
              <ul className="space-y-1.5 text-sm text-blue-800">
                <li>• Ghế VIP là những hàng ghế trung tâm rạp, có tầm nhìn rộng và âm thanh sống động nhất.</li>
                <li>• Ghế Đôi (Couple) là lựa chọn riêng tư dành cho 2 người (Giá vé sẽ được tính tự động gấp đôi).</li>
                <li>• Suất chiếu sẽ tự động khóa chức năng giữ ghế sau 10 phút nếu bạn không tiến hành thanh toán.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

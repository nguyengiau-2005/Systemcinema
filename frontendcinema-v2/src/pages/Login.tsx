import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Film, Users, Globe, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosClient from '../api/axiosClient';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  // 1. Đồng bộ State giống cấu trúc Admin để tránh nhầm lẫn biến
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  // Quản lý trạng thái giao diện
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 2. Bắn dữ liệu credentials ({ username, password }) lên backend giống hệt Admin
      const data = await axiosClient.post('/auth/login', credentials) as any;
      const payload = data?.data ?? data;

      if (payload && payload.token) {
        // Lưu token vào localStorage
        localStorage.setItem('token', payload.token);
        
        // Gọi API lấy profile thực tế từ DB để lưu vào localStorage
        try {
          const profileData = await axiosClient.get('/users/profile') as any;
          const profile = profileData?.data ?? profileData;
          
          if (profile) {
            localStorage.setItem('role', profile.role || 'CUSTOMER');
            localStorage.setItem('user', JSON.stringify({
              id: profile.id,
              username: profile.username,
              fullName: profile.fullName,
              email: profile.email,
              phone: profile.phone,
              avatar: profile.avatar,
              role: profile.role,
              membershipLevel: profile.membershipLevel,
              points: profile.points
            }));
          }
        } catch (profileError) {
          console.error('Không thể lấy thông tin profile thực:', profileError);
          // Dự phòng nếu API profile lỗi thì lưu thông tin tạm
          localStorage.setItem('role', 'CUSTOMER');
          localStorage.setItem('user', JSON.stringify({
            fullName: credentials.username || 'Thành viên',
            username: credentials.username,
            role: 'CUSTOMER',
            avatar: null
          }));
        }

        // Đăng nhập thành công, hiển thị thông báo và chuyển hướng sau 3 giây
        setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setErrorMessage('Không nhận được token từ hệ thống. Vui lòng thử đăng nhập lại.');
      }
    } catch (error: any) {
      console.error('Login error detail:', error);
      // Hiển thị thông báo lỗi đồng bộ với hệ thống
      setErrorMessage('Sai tài khoản hoặc mật khẩu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Film className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Chào mừng trở lại!</h1>
            <p className="text-gray-800">Đăng nhập để trải nghiệm đầy đủ tính năng</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Vùng hiển thị lỗi */}
            {errorMessage && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center font-medium"
              >
                {errorMessage}
              </motion.div>
            )}

            {/* Vùng hiển thị thông báo thành công */}
            {successMessage && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl text-center font-medium"
              >
                {successMessage}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username (Tên đăng nhập / Email) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tên đăng nhập hoặc Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-gray-900 bg-white placeholder:text-gray-600"
                    placeholder="Nhập tên đăng nhập của bạn"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-gray-900 bg-white placeholder:text-gray-600"
                    placeholder="Nhập mật khẩu"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Ghi nhớ & Quên mk */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-red-600 rounded" disabled={isLoading} />
                  <span className="text-sm text-gray-800">Ghi nhớ đăng nhập</span>
                </label>
                <a href="#" className="text-sm text-red-600 hover:text-red-700 font-semibold">
                  Quên mật khẩu?
                </a>
              </div>

              {/* Nút Đăng ký / Đang xử lý */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng Nhập'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-700">Hoặc đăng nhập với</span>
              </div>
            </div>

            {/* Mạng xã hội */}
            <div className="grid grid-cols-2 gap-3">
              <button disabled={isLoading} className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Facebook</span>
              </button>
              <button disabled={isLoading} className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                <Globe className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-gray-900">Google</span>
              </button>
            </div>

            <p className="text-center mt-6 text-gray-800">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-red-600 hover:text-red-700 font-semibold">
                Đăng ký ngay
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

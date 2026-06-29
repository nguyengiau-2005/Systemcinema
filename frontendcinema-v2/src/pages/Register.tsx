import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Film, User, Phone, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosClient from '../api/axiosClient';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu không khớp!');
      setIsLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setErrorMessage('Số điện thoại phải bao gồm đúng 10 chữ số!');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với điều khoản sử dụng');
      setIsLoading(false);
      return;
    }

    try {
      // Call the backend registration API
      const response = await axiosClient.post('/auth/register', {
        fullName: formData.name,
        username: formData.email, // using email as username
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      }) as any;
      const payload = response?.data ?? response;

      if (payload && payload.token) {
        // Save user data to ensure clean state later, but we will redirect to login instead of auto-login
        // (Optional: You could also skip saving token if you strictly want them to login manually)

        setSuccessMessage('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErrorMessage('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      setErrorMessage(error.response?.data?.error || error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <h1 className="text-3xl font-bold mb-2">Tạo tài khoản mới</h1>
            <p className="text-gray-800">Đăng ký để nhận ưu đãi độc quyền</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center font-medium"
                >
                  {errorMessage}
                </motion.div>
              )}
              {/* Success Message */}
              {successMessage && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl text-center font-medium"
                >
                  {successMessage}
                </motion.div>
              )}
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Họ và tên *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-gray-900 bg-white placeholder:text-gray-600"
                    placeholder="Nhập họ và tên"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-gray-900 bg-white placeholder:text-gray-600"
                    placeholder="email@example.com"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Số điện thoại *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-gray-900 bg-white placeholder:text-gray-600"
                    placeholder="0901234567"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Mật khẩu *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-gray-900 bg-white placeholder:text-gray-600"
                    placeholder="Tối thiểu 8 ký tự"
                    disabled={isLoading}
                    required
                    minLength={8}
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Xác nhận mật khẩu *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors text-gray-900 bg-white placeholder:text-gray-600"
                    placeholder="Nhập lại mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => updateField('agreeTerms', e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded mt-0.5"
                  required
                />
                <span className="text-sm text-gray-800">
                  Tôi đồng ý với{' '}
                  <a href="#" className="text-red-600 hover:text-red-700 font-semibold">
                    Điều khoản sử dụng
                  </a>{' '}
                  và{' '}
                  <a href="#" className="text-red-600 hover:text-red-700 font-semibold">
                    Chính sách bảo mật
                  </a>
                </span>
              </label>

              {/* Register Button */}
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
                  'Đăng Ký'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-700">Hoặc đăng ký với</span>
              </div>
            </div>

            {/* Social Register */}
            {/* <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Facebook</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all">
                <Chrome className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-gray-900">Google</span>
              </button>
            </div> */}

            {/* Login Link */}
            <p className="text-center mt-6 text-gray-800">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">
                Đăng nhập
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

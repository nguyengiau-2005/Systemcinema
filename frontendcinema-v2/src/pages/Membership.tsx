import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Award, Star, Gift, Zap, Crown, Check, ArrowLeft, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Membership() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const benefits = {
    Silver: [
      'Tích điểm cho mỗi giao dịch',
      'Ưu đãi sinh nhật đặc biệt',
      'Thông báo phim mới sớm nhất',
      'Hỗ trợ khách hàng ưu tiên',
    ],
    Gold: [
      'Tất cả quyền lợi Silver',
      'Tích điểm x1.5 cho mỗi giao dịch',
      'Giảm 10% combo bắp nước',
      'Đặt ghế trước 24h',
      'Miễn phí 1 voucher/tháng',
      'Suất chiếu sớm độc quyền',
    ],
    Platinum: [
      'Tất cả quyền lợi Gold',
      'Tích điểm x2 cho mỗi giao dịch',
      'Giảm 20% combo bắp nước',
      'Đặt ghế trước 48h',
      'Miễn phí 2 voucher/tháng',
      'Phòng chờ VIP miễn phí',
      'Ưu tiên check-in nhanh',
      'Quà tặng sinh nhật cao cấp',
    ],
  };

  const tiers = [
    {
      name: 'Silver',
      icon: Star,
      color: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      requirement: '0 - 999 điểm',
      points: 0,
    },
    {
      name: 'Gold',
      icon: Award,
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      requirement: '1,000 - 4,999 điểm',
      points: 1000,
      popular: true,
    },
    {
      name: 'Platinum',
      icon: Crown,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      requirement: 'Từ 5,000 điểm',
      points: 5000,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại trang cá nhân
            </button>

            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 py-2 rounded-full mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Chương trình thành viên</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Thẻ Thành Viên CineVerse</h1>
            <p className="text-gray-600 text-lg">
              Tích điểm mỗi lần đặt vé và nhận những ưu đãi đặc biệt
            </p>
          </motion.div>

          {/* User Dashboard */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-100 dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-orange-100 border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-orange-600">
                    {user?.fullName?.[0] || user?.username?.[0] || 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user?.fullName || user?.username}</h2>
                    <p className="text-gray-500 mb-2">Thành viên {user?.membershipLevel || 'Silver'}</p>
                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <Star className="w-4 h-4" /> {user?.points || 0} điểm
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full max-w-md">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-gray-500">Silver</span>
                    <span className="text-yellow-600">Gold</span>
                    <span className="text-purple-600">Platinum</span>
                  </div>
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((user?.points || 0) / 5000) * 100, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-gray-400 via-yellow-400 to-purple-500"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Cần thêm {Math.max(1000 - (user?.points || 0), 0)} điểm để thăng hạng Gold
                  </p>
                </div>
              </div>
              
              {/* Đổi quà */}
              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-red-500" /> Đổi Điểm Nhận Quà
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: 'Voucher 20k', pts: 5000, color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30' },
                    { title: 'Bắp Rang Bơ', pts: 7000, color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30' },
                    { title: 'Combo 1', pts: 10000, color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30' },
                    { title: 'Vé 2D Miễn Phí', pts: 15000, color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30' },
                  ].map((gift, i) => {
                    const canRedeem = (user?.points || 0) >= gift.pts;
                    return (
                      <div key={i} className={`border rounded-xl p-4 text-center ${canRedeem ? 'cursor-pointer hover:shadow-md' : 'opacity-70'} transition-all ${gift.color}`}>
                        <h4 className="font-bold text-sm mb-1">{gift.title}</h4>
                        <p className="text-xs font-semibold opacity-80">{gift.pts} điểm</p>
                        <button 
                          onClick={() => {
                            if (!canRedeem) {
                              alert(`Yêu cầu từ ${gift.pts} điểm trở lên mới được đổi ${gift.title}!`);
                            } else {
                              alert(`Đổi thành công: ${gift.title}! (Giả lập)`);
                            }
                          }}
                          className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${
                            canRedeem 
                              ? 'bg-white/90 dark:bg-black/20 hover:bg-white cursor-pointer' 
                              : 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800'
                          }`}
                        >
                          Đổi Quà
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Membership Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {tiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                    tier.popular ? 'ring-4 ring-yellow-400 transform scale-105' : ''
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                      Phổ biến
                    </div>
                  )}

                  <div className={`bg-gradient-to-br ${tier.color} p-8 text-white`}>
                    <Icon className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-white/90 text-sm">{tier.requirement}</p>
                  </div>

                  <div className="p-6">
                    <h4 className="font-bold mb-4">Quyền lợi:</h4>
                    <ul className="space-y-3 mb-6">
                      {benefits[tier.name as keyof typeof benefits].map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        tier.popular
                          ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* How to Earn Points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Cách Tích Điểm</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: Gift, title: 'Đặt vé xem phim', points: '10 điểm / 10,000đ', color: 'text-red-600' },
                { icon: Zap, title: 'Mua combo bắp nước', points: '5 điểm / 10,000đ', color: 'text-orange-600' },
                { icon: Star, title: 'Đánh giá phim', points: '20 điểm / đánh giá', color: 'text-yellow-600' },
                { icon: Award, title: 'Giới thiệu bạn bè', points: '100 điểm / người', color: 'text-purple-600' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="text-center">
                    <div className={`w-16 h-16 ${item.color.replace('text', 'bg').replace('600', '100')} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-8 h-8 ${item.color}`} />
                    </div>
                    <h3 className="font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.points}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Câu Hỏi Thường Gặp</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Làm thế nào để đăng ký thành viên?',
                  a: 'Bạn chỉ cần tạo tài khoản CineVerse và sẽ tự động trở thành thành viên Silver. Điểm sẽ được tích lũy mỗi khi bạn đặt vé.',
                },
                {
                  q: 'Điểm thưởng có thời hạn không?',
                  a: 'Điểm thưởng của bạn có hiệu lực 12 tháng kể từ ngày tích lũy. Sau thời gian này, điểm sẽ tự động hết hạn.',
                },
                {
                  q: 'Tôi có thể dùng điểm để làm gì?',
                  a: 'Bạn có thể đổi điểm lấy voucher giảm giá, vé miễn phí, combo bắp nước và nhiều quà tặng hấp dẫn khác.',
                },
                {
                  q: 'Làm sao để lên hạng cao hơn?',
                  a: 'Hạng thành viên được tính dựa trên tổng điểm tích lũy trong 12 tháng gần nhất. Càng đặt vé nhiều, bạn càng nhanh lên hạng cao hơn.',
                },
              ].map((faq, i) => (
                <div key={i} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <h3 className="font-bold mb-2">{faq.q}</h3>
                  <p className="text-gray-600 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

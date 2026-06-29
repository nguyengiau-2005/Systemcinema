import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Gift, Dices, Trophy, Star, ChevronRight, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { playClickSound, playWinSound } from '../utils/gameUtils';

const Games: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [quests, setQuests] = useState({ date: '', login: true, gamesPlayed: 0, claimedLogin: false, claimedGames: false });
  const [tickerNews, setTickerNews] = useState<string[]>([]);

  useEffect(() => {
    fetchLeaderboard();
    initQuests();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axiosClient.get('/games/leaderboard');
      const data = (res as any).data || res;
      setLeaderboard(Array.isArray(data) ? data : []);
      
      const news = [
        '🎉 Nguyễn Văn A vừa trúng 500 điểm từ Máy Đánh Bạc!',
        '🌟 Trần Thị B vừa lật được 200 điểm ở Lật Thẻ Bài!',
        '🎁 Lê Hoàng C nhận được 1000 điểm từ Hộp Quà Bí Ẩn!',
      ];
      if (Array.isArray(data) && data.length > 0) {
        news.push(`🏆 Chúc mừng ${data[0].username} đang dẫn đầu bảng xếp hạng với ${data[0].points} điểm!`);
      }
      setTickerNews(news);
    } catch (e) {
      console.error(e);
    }
  };

  const initQuests = () => {
    const today = new Date().toDateString();
    let q = localStorage.getItem('daily_quests');
    if (q) {
      const parsed = JSON.parse(q);
      if (parsed.date === today) {
        setQuests(parsed);
        return;
      }
    }
    const newQ = { date: today, login: true, gamesPlayed: 0, claimedLogin: false, claimedGames: false };
    localStorage.setItem('daily_quests', JSON.stringify(newQ));
    setQuests(newQ);
  };

  const claimQuest = async (type: 'login' | 'games') => {
    try {
      const points = type === 'login' ? 50 : 100;
      await axiosClient.post('/games/claim-quest', { points });
      playWinSound();
      
      const newQ = { ...quests, [type === 'login' ? 'claimedLogin' : 'claimedGames']: true };
      setQuests(newQ);
      localStorage.setItem('daily_quests', JSON.stringify(newQ));
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userObj.points = (userObj.points || 0) + points;
        localStorage.setItem('user', JSON.stringify(userObj));
        window.dispatchEvent(new Event('userUpdated'));
      }
    } catch (e) {
      console.error(e);
      alert('Vui lòng đăng nhập để nhận thưởng.');
      navigate('/login');
    }
  };

  const availableGames = [
    {
      id: 'mystery-box',
      title: 'Hộp Quà Bí Ẩn',
      description: 'Mở hộp quà để nhận phần thưởng bất ngờ mỗi ngày.',
      icon: <Gift className="w-16 h-16 text-pink-400 drop-shadow-md group-hover:scale-110 transition-transform" />,
      bgGradient: 'from-purple-900 to-indigo-900',
      borderClass: 'border-purple-500/30 group-hover:border-purple-400',
      link: '/games/mystery-box'
    },
    {
      id: 'lucky-wheel',
      title: 'Vòng Quay May Mắn',
      description: 'Thử thách nhân phẩm với vòng quay nhận hàng ngàn điểm thưởng.',
      icon: <Dices className="w-16 h-16 text-yellow-400 drop-shadow-md group-hover:scale-110 transition-transform" />,
      bgGradient: 'from-orange-900 to-red-900',
      borderClass: 'border-orange-500/30 group-hover:border-orange-400',
      link: '/games/lucky-wheel'
    },
    {
      id: 'card-flip',
      title: 'Lật Thẻ Bài',
      description: 'Lật thẻ bài bí ẩn để tìm phần thưởng được giấu.',
      icon: <span className="text-6xl group-hover:scale-110 transition-transform block">🃏</span>,
      bgGradient: 'from-blue-900 to-cyan-900',
      borderClass: 'border-blue-500/30 group-hover:border-blue-400',
      link: '/games/card-flip'
    },
    {
      id: 'scratch-card',
      title: 'Cào Thẻ Trúng Thưởng',
      description: 'Cào lớp giấy mờ để nhận điểm thưởng may mắn.',
      icon: <span className="text-6xl group-hover:scale-110 transition-transform block">🎫</span>,
      bgGradient: 'from-slate-700 to-slate-900',
      borderClass: 'border-slate-500/30 group-hover:border-slate-400',
      link: '/games/scratch-card'
    },
    {
      id: 'egg-smash',
      title: 'Đập Trứng Vàng',
      description: 'Đập vỡ quả trứng vàng để hốt trọn điểm thưởng.',
      icon: <span className="text-6xl group-hover:scale-110 transition-transform block">🥚</span>,
      bgGradient: 'from-yellow-700 to-yellow-900',
      borderClass: 'border-yellow-500/30 group-hover:border-yellow-400',
      link: '/games/egg-smash'
    },
    {
      id: 'lucky-envelope',
      title: 'Bao Lì Xì',
      description: 'Nhận lộc điểm thưởng với những phong bao đỏ rực.',
      icon: <span className="text-6xl group-hover:scale-110 transition-transform block">🧧</span>,
      bgGradient: 'from-red-800 to-red-950',
      borderClass: 'border-red-500/30 group-hover:border-red-400',
      link: '/games/lucky-envelope'
    },
    {
      id: 'slot-machine',
      title: 'Máy Đánh Bạc',
      description: 'Gạt cần máy cuộn và nhận jackpot điểm thưởng.',
      icon: <span className="text-6xl group-hover:scale-110 transition-transform block">🎰</span>,
      bgGradient: 'from-emerald-800 to-green-950',
      borderClass: 'border-emerald-500/30 group-hover:border-emerald-400',
      link: '/games/slot-machine'
    }
  ];

  const handleGameClick = () => {
    playClickSound();
    
    // Tăng số lần chơi game trong quest
    const newQ = { ...quests, gamesPlayed: quests.gamesPlayed + 1 };
    setQuests(newQ);
    localStorage.setItem('daily_quests', JSON.stringify(newQ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <Header />
      
      {/* 2. Real-time Ticker (Bảng Tin Trúng Thưởng) */}
      <div className="w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border-y border-purple-500/30 py-2 overflow-hidden flex items-center">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] inline-block font-bold text-yellow-300 text-sm md:text-base" style={{ animation: 'marquee 20s linear infinite' }}>
          {tickerNews.join(' ✦ ')} ✦ {tickerNews.join(' ✦ ')}
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      
      <div className="flex-grow flex flex-col items-center py-10 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>

        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4 z-10 text-center tracking-tight drop-shadow-lg">
          Game Hub Đổi Thưởng
        </h1>
        <p className="text-slate-300 mb-10 z-10 text-center max-w-2xl text-lg">
          Chơi game săn điểm CineCoins mỗi ngày. Tích lũy điểm để đổi vé xem phim, bắp nước và các voucher độc quyền!
        </p>

        <div className="w-full max-w-7xl z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Game Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-yellow-400">
              <Dices className="w-6 h-6" /> Kho Trò Chơi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableGames.map((game) => (
                <Link 
                  key={game.id} 
                  to={game.link}
                  onClick={handleGameClick}
                  className={`group relative flex flex-col items-center p-6 rounded-3xl bg-gradient-to-br ${game.bgGradient} border-2 ${game.borderClass} shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="mb-4 z-10">{game.icon}</div>
                  <h3 className="text-xl font-bold mb-2 z-10 text-white group-hover:text-yellow-300 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-slate-300 text-sm text-center z-10 group-hover:text-white transition-colors mb-6">
                    {game.description}
                  </p>
                  <div className="mt-auto px-6 py-2 bg-white/10 rounded-full text-xs font-bold tracking-wider group-hover:bg-white group-hover:text-slate-900 transition-all z-10">
                    CHƠI NGAY
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column: Leaderboard & Quests */}
          <div className="space-y-8">
            
            {/* 3. Daily Quests (Nhiệm vụ hàng ngày) */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-400">
                <Star className="w-5 h-5" /> Nhiệm Vụ Hàng Ngày
              </h2>
              <div className="space-y-4">
                {/* Quest 1: Đăng nhập */}
                <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-white">Đăng nhập hôm nay</h4>
                    <p className="text-xs text-slate-400 mt-1">Thưởng: <span className="text-yellow-400 font-bold">+50 điểm</span></p>
                  </div>
                  <div>
                    {quests.claimedLogin ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><CheckCircle2 className="w-4 h-4"/> Đã nhận</span>
                    ) : (
                      <button onClick={() => claimQuest('login')} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all">Nhận Quà</button>
                    )}
                  </div>
                </div>

                {/* Quest 2: Chơi 3 game */}
                <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-white">Chơi 3 lần game bất kỳ</h4>
                    <p className="text-xs text-slate-400 mt-1">Tiến độ: <span className="text-cyan-400 font-bold">{Math.min(quests.gamesPlayed, 3)}/3</span> • Thưởng: <span className="text-yellow-400 font-bold">+100 điểm</span></p>
                  </div>
                  <div>
                    {quests.claimedGames ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><CheckCircle2 className="w-4 h-4"/> Đã nhận</span>
                    ) : (
                      <button 
                        disabled={quests.gamesPlayed < 3}
                        onClick={() => claimQuest('games')} 
                        className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${quests.gamesPlayed >= 3 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                      >
                        Nhận Quà
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Leaderboard (Bảng Xếp Hạng) */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" /> Bảng Xếp Hạng Top 5
              </h2>
              <div className="space-y-3">
                {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((user, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl ${idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : idx === 1 ? 'bg-slate-300/10 border border-slate-300/20' : idx === 2 ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-800'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-500 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-400 text-orange-950' : 'bg-slate-700 text-slate-400'}`}>
                      {idx + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
                      {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">{user.username.charAt(0).toUpperCase()}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{user.username}</h4>
                    </div>
                    <div className="text-yellow-400 font-black text-sm whitespace-nowrap">
                      {user.points} <span className="text-[10px] text-yellow-600">pts</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-slate-500 text-sm py-4">Đang tải bảng xếp hạng...</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 5. Redeem Shop Teaser (Cửa Hàng Đổi Thưởng) */}
        <div className="w-full max-w-7xl mt-12 z-10">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-10 translate-y-10 group-hover:scale-110 transition-transform duration-700">
              <Gift className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-3xl font-black text-white mb-2">Đổi Thưởng Bất Tận</h2>
                <p className="text-red-100 max-w-xl">
                  Dùng điểm CineCoins tích lũy được từ Mini Game để đổi ngay các ưu đãi đặc quyền: Vé xem phim 0đ, Combo bắp nước siêu tiết kiệm và nhiều hơn thế nữa!
                </p>
              </div>
              <button 
                onClick={() => { playClickSound(); navigate('/membership'); }}
                className="px-8 py-4 bg-white text-red-600 font-black rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Vào Cửa Hàng Đổi Thưởng <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default Games;

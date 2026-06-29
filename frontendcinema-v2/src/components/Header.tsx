import { useState, useEffect, useRef } from 'react';
import { Film, Search, User, Menu, LogOut, Ticket, Award, X, Calendar, MapPin, ChevronDown, MonitorPlay } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import CineBot from './CineBot';
import LuckyWheel from './LuckyWheel';
import LevelUpModal from './LevelUpModal';

// Define the shape of your user data for better TypeScript support
interface UserData {
  id?: string | number;
  username?: string;
  fullName?: string;
  avatar?: string;
  role?: string;
  membershipLevel?: string;
  points?: number;
}

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ show: false, newLevel: 'Gold', pointsEarned: 0 });

  // Ref for the dropdown menu to detect outside clicks
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Failed to parse user data from local storage", error);
      }
    };

    const handleLevelUp = (e: any) => {
      setLevelUpData({
        show: true,
        newLevel: e.detail?.newLevel || 'Gold',
        pointsEarned: e.detail?.pointsEarned || 0
      });
    };

    loadUser();
    window.addEventListener('userUpdated', loadUser);
    window.addEventListener('levelUp', handleLevelUp);
    
    return () => {
      window.removeEventListener('userUpdated', loadUser);
      window.removeEventListener('levelUp', handleLevelUp);
    };
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
    setShowUserMenu(false);
    navigate('/');
  };

  const getShortName = () => {
    const nameToDisplay = user?.fullName || user?.username || 'Thành viên';
    return nameToDisplay.trim().split(' ')[0];
  };

  const getFullName = () => {
    return user?.fullName || user?.username || 'Thành viên';
  };

  return (
    <>
    <header className="bg-black/80 backdrop-blur-md border-b border-white/10 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Film className="w-8 h-8" />
            <span className="text-2xl font-bold">CineVerse</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              {t('header.home', 'Trang Chủ')}
            </Link>
            <Link to="/movies" className="hover:opacity-80 transition-opacity">
              {t('header.movies', 'Phim')}
            </Link>
            <Link to="/membership" className="hover:opacity-80 transition-opacity capitalize">
              {t('header.membership', 'Thành Viên')}
            </Link>
            <Link to="/games" className="hover:opacity-80 transition-opacity font-bold text-yellow-400">
              Mini Game
            </Link>
            <a href="#promotions" className="hover:opacity-80 transition-opacity">
              {t('header.promotions', 'Khuyến Mãi')}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/20 rounded-full transition-colors hidden md:block">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={toggleLanguage} className="p-2 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1">
              <Globe className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">{i18n.language}</span>
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 font-bold text-sm">
                        {getShortName()[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="hidden md:block font-semibold">
                    {getShortName()}
                  </span>
                </button>

                {/* Dropdown transition added for smoother UI */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200 origin-top-right transition-all duration-200">
                    <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
                      <p className="font-bold text-lg text-white line-clamp-1">{getFullName()}</p>
                      {(user?.membershipLevel || user?.points !== undefined) && (
                        <div className="mt-2 inline-block bg-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-slate-300 border border-slate-700">
                          {user?.membershipLevel || 'Gold'} • {user?.points || 0} điểm
                        </div>
                      )}
                    </div>

                    <div className="p-2 space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <User className="w-5 h-5 text-slate-400" />
                        <span className="font-semibold">Trang cá nhân</span>
                      </Link>
                      <Link
                        to="/booking-history"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <Ticket className="w-5 h-5 text-slate-400" />
                        <span className="font-semibold">Lịch sử đặt vé</span>
                      </Link>
                      <Link
                        to="/membership"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <Award className="w-5 h-5 text-slate-400" />
                        <span className="font-semibold">Thẻ thành viên</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-950/30 rounded-xl transition-colors text-red-500"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-semibold">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors font-semibold"
              >
                <User className="w-5 h-5" />
                Đăng nhập
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 py-4 border-t border-white/20">
            <nav className="flex flex-col gap-3">
              <Link to="/" onClick={() => setShowMobileMenu(false)} className="hover:opacity-80 transition-opacity py-2">
                Trang Chủ
              </Link>
              <Link to="/movies" onClick={() => setShowMobileMenu(false)} className="hover:opacity-80 transition-opacity py-2">
                Phim
              </Link>
              <Link to="/membership" onClick={() => setShowMobileMenu(false)} className="hover:opacity-80 transition-opacity py-2">
                {user?.role?.toLowerCase() === 'user' ? 'Khách Hàng' : user?.role || 'Thành Viên'}
              </Link>
              <Link to="/games" onClick={() => setShowMobileMenu(false)} className="hover:opacity-80 transition-opacity py-2 font-bold text-yellow-400">
                Mini Game
              </Link>
              <a href="#promotions" onClick={() => setShowMobileMenu(false)} className="hover:opacity-80 transition-opacity py-2">
                Khuyến Mãi
              </a>
              {!user && (
                <Link to="/login" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-2 py-2 font-semibold">
                  <User className="w-5 h-5" />
                  Đăng nhập
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
    <CineBot />
    <LuckyWheel />
    <LevelUpModal 
      isOpen={levelUpData.show} 
      onClose={() => setLevelUpData(prev => ({ ...prev, show: false }))} 
      newLevel={levelUpData.newLevel} 
      pointsEarned={levelUpData.pointsEarned} 
    />
    </>
  );
}

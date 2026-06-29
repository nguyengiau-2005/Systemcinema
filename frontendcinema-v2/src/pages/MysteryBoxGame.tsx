import React, { useState } from 'react';
import { gameApi } from '../api/gameApi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Gift } from 'lucide-react';

import { handleGameWin } from '../utils/gameUtils';

const MysteryBoxGame: React.FC = () => {
  const [opening, setOpening] = useState(false);
  const [openedBox, setOpenedBox] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [pointsWon, setPointsWon] = useState<number | null>(null);

  const boxes = [0, 1, 2];

  const handleOpenBox = async (boxIndex: number) => {
    if (opening || openedBox !== null) return;
    setOpening(true);
    setOpenedBox(boxIndex); // Đánh dấu hộp đang mở để làm animation rung

    try {
      const response = await gameApi.spinWheel();
      
      // Chờ 1.5s để chạy animation rung hộp trước khi hiện kết quả
      setTimeout(() => {
        setOpening(false);
        setPointsWon(response.pointsWon);
        setResultMsg(`🎉 BÙM! Bạn đã nhận được ${response.pointsWon} điểm!`);
        handleGameWin(response.pointsWon, response.totalLoyaltyPoints);
      }, 1500);

    } catch (error) {
      console.error("Open box error", error);
      alert("Có lỗi xảy ra hoặc bạn chưa đăng nhập!");
      setOpening(false);
      setOpenedBox(null);
    }
  };

  const handleReset = () => {
    setOpenedBox(null);
    setPointsWon(null);
    setResultMsg(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      <Header />
      
      <div className="flex-grow flex flex-col items-center justify-center py-10 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-6 z-10 text-center drop-shadow-lg">
          Hộp Quà Bí Ẩn
        </h1>
        <p className="text-slate-300 mb-12 z-10 text-center max-w-lg px-4 text-lg">
          Chọn một trong ba hộp quà bên dưới để có cơ hội nhận hàng ngàn điểm thưởng Loyalty mỗi ngày!
        </p>

        {/* Các hộp quà */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 z-10 mb-12">
          {boxes.map((index) => {
            const isSelected = openedBox === index;
            const isOpened = isSelected && !opening && pointsWon !== null;
            const isNotSelected = openedBox !== null && openedBox !== index;

            return (
              <div 
                key={index}
                className={`relative flex flex-col items-center justify-center transition-all duration-500 ${isNotSelected ? 'opacity-40 scale-90 blur-[2px]' : 'scale-100'} ${opening && isSelected ? 'animate-bounce' : ''}`}
              >
                <button
                  onClick={() => handleOpenBox(index)}
                  disabled={openedBox !== null}
                  className={`relative group w-32 h-32 md:w-40 md:h-40 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300
                    ${isOpened 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-2 border-green-300 transform -translate-y-4' 
                      : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-2 cursor-pointer'}
                  `}
                >
                  {isOpened ? (
                    <div className="text-center animate-fade-in">
                      <span className="block text-4xl font-black text-yellow-300 drop-shadow-md">+{pointsWon}</span>
                      <span className="text-sm font-bold mt-1">ĐIỂM</span>
                    </div>
                  ) : (
                    <Gift className={`w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg transition-transform ${opening && isSelected ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-12'}`} />
                  )}

                  {/* Nắp hộp ảo trang trí */}
                  {!isOpened && (
                     <div className="absolute -top-4 w-10/12 h-6 bg-white/20 rounded-t-lg backdrop-blur-sm"></div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Kết quả & Nút chơi lại */}
        {resultMsg && (
          <div className="flex flex-col items-center z-10 animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-6">
               <p className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 tracking-wide text-center">
                 {resultMsg}
               </p>
            </div>
            
            <button 
              onClick={handleReset}
              className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors shadow-lg"
            >
              Chơi Lần Nữa
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MysteryBoxGame;

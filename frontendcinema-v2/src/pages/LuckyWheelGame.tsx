import React, { useState } from 'react';
import { gameApi } from '../api/gameApi';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { handleGameWin } from '../utils/gameUtils';

const PRIZES = [10, 20, 50, 100, 200, 300];

// Màu sắc cho 6 phần thưởng
const COLORS = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#f97316'  // orange-500
];

const LuckyWheelGame: React.FC = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResultMsg(null);

    try {
      const response = await gameApi.spinWheel();
      const prizeIndex = response.prizeIndex; 

      const extraSpins = 5 * 360; // 5 vòng
      const segmentAngle = 360 / PRIZES.length;
      
      const stopAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);
      const randomOffset = (Math.random() - 0.5) * (segmentAngle - 10);
      
      const newRotation = rotation + extraSpins + stopAngle + randomOffset;
      setRotation(newRotation);

      setTimeout(() => {
        setSpinning(false);
        setResultMsg(`🎉 Chúc mừng! Bạn đã trúng ${response.pointsWon} điểm!`);
        handleGameWin(response.pointsWon, response.totalLoyaltyPoints);
      }, 4000);

    } catch (error) {
      console.error("Spin error", error);
      alert("Có lỗi xảy ra hoặc bạn chưa đăng nhập!");
      setSpinning(false);
    }
  };

  const conicGradient = PRIZES.map((_, i) => {
    const startAngle = i * 60;
    const endAngle = (i + 1) * 60;
    return `${COLORS[i]} ${startAngle}deg ${endAngle}deg`;
  }).join(', ');

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center py-10 overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8 z-10 text-center">
          Vòng Quay May Mắn
        </h1>
        <p className="text-slate-300 mb-10 z-10 text-center max-w-md px-4">
          Thử vận may mỗi ngày để nhận ngay hàng ngàn điểm thưởng tích lũy. Dùng điểm đổi vé xem phim và nhiều quà tặng hấp dẫn!
        </p>

        <div className="relative w-80 h-80 md:w-96 md:h-96 z-10 drop-shadow-2xl">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
             <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-yellow-300 drop-shadow-md"></div>
          </div>

          <div 
            className="w-full h-full rounded-full border-8 border-slate-800 shadow-[0_0_50px_rgba(245,158,11,0.3)] transition-transform ease-out"
            style={{ 
              background: `conic-gradient(${conicGradient})`,
              transform: `rotate(${rotation}deg)`,
              transitionDuration: spinning ? '4s' : '0s'
            }}
          >
            {PRIZES.map((prize, i) => {
              const rotationAngle = (i * 60) + 30;
              return (
                <div 
                  key={i} 
                  className="absolute w-full h-full text-center text-white font-bold text-xl md:text-2xl"
                  style={{ transform: `rotate(${rotationAngle}deg)` }}
                >
                  <div className="pt-6 drop-shadow-md">
                    {prize}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={handleSpin}
              disabled={spinning}
              className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center font-bold text-slate-900 border-4 border-slate-800 shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="text-lg md:text-xl tracking-wider">QUAY</span>
            </button>
          </div>
        </div>

        {resultMsg && (
          <div className="mt-12 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 animate-fade-in-up z-10">
             <p className="text-2xl font-bold text-yellow-400">{resultMsg}</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default LuckyWheelGame;

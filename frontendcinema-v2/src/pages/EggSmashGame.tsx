import React, { useState } from 'react';
import { gameApi } from '../api/gameApi';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { handleGameWin } from '../utils/gameUtils';

const EggSmashGame: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [smashed, setSmashed] = useState<number | null>(null);
  const [pointsWon, setPointsWon] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const eggs = [0, 1, 2];

  const handleSmash = async (index: number) => {
    if (playing || smashed !== null) return;
    setPlaying(true);
    setSmashed(index);

    try {
      const response = await gameApi.spinWheel();
      
      // Delay to let smash animation finish
      setTimeout(() => {
        setPlaying(false);
        setPointsWon(response.pointsWon);
        setResultMsg(`Trứng vỡ! Chúc mừng bạn được ${response.pointsWon} điểm!`);
        handleGameWin(response.pointsWon, response.totalLoyaltyPoints);
      }, 600);

    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra hoặc chưa đăng nhập!");
      setPlaying(false);
      setSmashed(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center py-10 relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-6 z-10 text-center">
          Đập Trứng Vàng
        </h1>
        <p className="text-slate-300 mb-12 z-10 text-center max-w-lg px-4 text-lg">
          Chọn một quả trứng vàng và đập vỡ để nhận thưởng!
        </p>

        <div className="flex flex-row justify-center gap-6 md:gap-12 z-10 mb-12">
          {eggs.map((index) => {
            const isSmashed = smashed === index;
            const isOther = smashed !== null && smashed !== index;
            const showPrize = isSmashed && !playing && pointsWon !== null;

            return (
              <div 
                key={index}
                className={`relative cursor-pointer transition-all duration-300 ${isOther ? 'opacity-30 scale-90 blur-[2px]' : 'hover:-translate-y-2'}`}
                onClick={() => handleSmash(index)}
              >
                {!showPrize ? (
                   // Quả trứng nguyên
                   <div className={`w-20 h-28 md:w-24 md:h-36 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5),_0_10px_20px_rgba(250,204,21,0.4)] flex items-center justify-center relative overflow-hidden border-2 border-yellow-200
                     ${isSmashed ? 'animate-ping opacity-0 bg-yellow-200' : 'bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600'}
                   `}>
                     {/* Gloss effect */}
                     <div className="absolute top-2 left-2 w-6 h-10 rounded-full bg-white opacity-40 transform rotate-12"></div>
                   </div>
                ) : (
                   // Quả trứng vỡ / kết quả
                   <div className="w-24 h-36 flex flex-col items-center justify-center animate-bounce">
                     <span className="text-4xl md:text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">+{pointsWon}</span>
                     <span className="text-sm font-bold text-yellow-100 mt-2">ĐIỂM</span>
                   </div>
                )}
              </div>
            );
          })}
        </div>

        {resultMsg && (
          <div className="flex flex-col items-center z-10 animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 mb-6">
               <p className="text-2xl font-black text-yellow-400">{resultMsg}</p>
            </div>
            <button onClick={() => { setSmashed(null); setPointsWon(null); setResultMsg(null); }} className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold uppercase hover:bg-slate-200">
              Đập Quả Khác
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default EggSmashGame;

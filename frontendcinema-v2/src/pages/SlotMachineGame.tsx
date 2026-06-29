import React, { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { handleGameWin } from '../utils/gameUtils';

const SlotMachineGame: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [pointsWon, setPointsWon] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  
  const [slotValue, setSlotValue] = useState<number>(0);

  // Animation cho số cuộn khi đang chơi
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (playing) {
      interval = setInterval(() => {
        const randomPoints = [10, 20, 50, 100, 200, 500];
        setSlotValue(randomPoints[Math.floor(Math.random() * randomPoints.length)]);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [playing]);

  const handlePullLever = async () => {
    if (playing) return;
    setPlaying(true);
    setPointsWon(null);
    setResultMsg(null);

    try {
      const response = await gameApi.spinWheel();
      
      // Delay to let slot spinning animation play
      setTimeout(() => {
        setPlaying(false);
        setSlotValue(response.pointsWon);
        setPointsWon(response.pointsWon);
        setResultMsg(`JACKPOT! Bạn nhận được ${response.pointsWon} điểm!`);
        handleGameWin(response.pointsWon, response.totalLoyaltyPoints);
      }, 2000);

    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra hoặc chưa đăng nhập!");
      setPlaying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center py-10 relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-6 z-10 text-center">
          Máy Đánh Bạc
        </h1>
        <p className="text-slate-300 mb-12 z-10 text-center max-w-lg px-4 text-lg">
          Gạt cần máy cuộn số để thử vận may nhận hàng trăm điểm thưởng!
        </p>

        <div className="flex flex-col items-center z-10 mb-12">
          
          {/* The Slot Machine */}
          <div className="relative flex items-center">
            
            {/* The Screen */}
            <div className="w-64 h-40 md:w-80 md:h-48 bg-slate-800 border-8 border-slate-700 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.3)] flex items-center justify-center overflow-hidden relative">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               
               <div className="bg-white px-8 py-4 rounded-xl border-4 border-slate-300 shadow-inner w-3/4 flex items-center justify-center h-24">
                 <span className={`text-6xl font-black text-slate-800 ${playing ? 'blur-[1px]' : ''}`}>
                   {slotValue}
                 </span>
               </div>
            </div>

            {/* The Lever */}
            <div className="absolute -right-8 md:-right-12 bottom-12 w-6 h-32 md:w-8 md:h-40 flex flex-col items-center">
              {/* Arm */}
              <div className={`w-3 md:w-4 bg-slate-500 rounded-t-full transition-all duration-300 transform origin-bottom ${playing ? 'h-16 md:h-20 rotate-45 translate-y-8' : 'h-32 md:h-40'}`}>
                 {/* Knob */}
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 rounded-full -ml-[14px] md:-ml-4 -mt-4 shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.5)]"></div>
              </div>
            </div>

          </div>

          <button 
            onClick={handlePullLever}
            disabled={playing}
            className="mt-12 px-10 py-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full font-black text-xl text-white shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest border-2 border-emerald-400"
          >
            {playing ? 'Đang Cuộn...' : 'Gạt Cần Ngay'}
          </button>

        </div>

        {resultMsg && (
          <div className="flex flex-col items-center z-10 animate-fade-in-up">
            <div className="bg-emerald-900/50 backdrop-blur-md px-8 py-4 rounded-2xl border border-emerald-500 mb-6">
               <p className="text-2xl font-black text-emerald-400">{resultMsg}</p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SlotMachineGame;

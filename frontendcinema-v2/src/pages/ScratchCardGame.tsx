import React, { useState } from 'react';
import { gameApi } from '../api/gameApi';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { handleGameWin } from '../utils/gameUtils';

const ScratchCardGame: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [pointsWon, setPointsWon] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleScratch = async () => {
    if (playing || scratched) return;
    setPlaying(true);

    try {
      const response = await gameApi.spinWheel();
      
      // Simulate scratch time
      setTimeout(() => {
        setPlaying(false);
        setScratched(true);
        setPointsWon(response.pointsWon);
        setResultMsg(`Tuyệt vời! Bạn cào trúng ${response.pointsWon} điểm!`);
        handleGameWin(response.pointsWon, response.totalLoyaltyPoints);
      }, 1000);

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
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-500 mb-6 z-10 text-center">
          Cào Thẻ Trúng Thưởng
        </h1>
        <p className="text-slate-300 mb-12 z-10 text-center max-w-lg px-4 text-lg">
          Cào lớp giấy bạc mờ để xem bạn may mắn nhận được bao nhiêu điểm hôm nay!
        </p>

        <div className="relative z-10 mb-12">
          <div 
            onClick={handleScratch}
            className={`w-64 h-32 md:w-80 md:h-40 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-700 shadow-2xl relative overflow-hidden border-4 border-slate-700
              ${scratched ? 'bg-gradient-to-r from-yellow-100 to-yellow-300' : 'bg-slate-300 hover:bg-slate-400'}
            `}
          >
            {/* The scratch layer */}
            <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-400 opacity-90 transition-opacity duration-1000 flex items-center justify-center ${scratched || playing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <span className="text-slate-600 font-bold text-xl drop-shadow-sm">CLICK ĐỂ CÀO</span>
            </div>

            {/* The prize underneath */}
            {scratched && (
              <div className="text-center animate-fade-in">
                <span className="block text-4xl md:text-6xl font-black text-red-600 drop-shadow-sm">{pointsWon}</span>
                <span className="text-red-700 font-bold mt-1 text-sm">ĐIỂM</span>
              </div>
            )}
            
            {/* Loading state */}
            {playing && (
              <div className="absolute inset-0 bg-slate-300 flex items-center justify-center">
                <span className="animate-pulse text-slate-600 font-bold text-xl">Đang cào...</span>
              </div>
            )}
          </div>
        </div>

        {resultMsg && (
          <div className="flex flex-col items-center z-10 animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 mb-6">
               <p className="text-2xl font-black text-yellow-400">{resultMsg}</p>
            </div>
            <button onClick={() => { setScratched(false); setPointsWon(null); setResultMsg(null); }} className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold uppercase hover:bg-slate-200">
              Chơi Lần Nữa
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ScratchCardGame;

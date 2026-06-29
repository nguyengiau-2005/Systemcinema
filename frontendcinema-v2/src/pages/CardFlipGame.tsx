import React, { useState } from 'react';
import { gameApi } from '../api/gameApi';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { handleGameWin } from '../utils/gameUtils';

const CardFlipGame: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [openedCard, setOpenedCard] = useState<number | null>(null);
  const [pointsWon, setPointsWon] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const cards = [0, 1, 2];

  const handleFlipCard = async (index: number) => {
    if (playing || openedCard !== null) return;
    setPlaying(true);
    setOpenedCard(index);

    try {
      const response: any = await gameApi.spinWheel();
      
      // Delay to let flip animation finish
      setTimeout(() => {
        setPlaying(false);
        setPointsWon(response.pointsWon);
        setResultMsg(`Quá đỉnh! Bạn nhận được ${response.pointsWon} điểm!`);
        handleGameWin(response.pointsWon, response.totalLoyaltyPoints);
      }, 800);

    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra hoặc chưa đăng nhập!");
      setPlaying(false);
      setOpenedCard(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center py-10 relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-6 z-10 text-center">
          Lật Thẻ Bài
        </h1>
        <p className="text-slate-300 mb-12 z-10 text-center max-w-lg px-4 text-lg">
          Chọn một lá bài bí ẩn để lật mở điểm thưởng của bạn!
        </p>

        <div className="flex flex-col md:flex-row gap-8 z-10 mb-12 perspective-1000">
          {cards.map((index) => {
            const isFlipped = openedCard === index && pointsWon !== null;
            const isOther = openedCard !== null && openedCard !== index;

            return (
              <div 
                key={index}
                className={`w-32 h-48 md:w-40 md:h-56 cursor-pointer transition-all duration-700 transform-style-3d ${isOther ? 'opacity-40 scale-90' : 'hover:-translate-y-2'} ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => handleFlipCard(index)}
              >
                {/* Mặt trước lá bài (Úp) */}
                <div className={`absolute w-full h-full backface-hidden bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border-2 border-slate-600 shadow-xl flex items-center justify-center ${isFlipped ? 'hidden' : ''}`}>
                  <div className="w-24 h-36 border border-slate-500/30 rounded-lg flex items-center justify-center bg-slate-800/50">
                     <span className="text-4xl text-slate-500 font-serif">?</span>
                  </div>
                </div>

                {/* Mặt sau lá bài (Ngửa) */}
                <div className={`absolute w-full h-full backface-hidden bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-xl border-2 border-yellow-200 shadow-[0_0_30px_rgba(250,204,21,0.5)] flex flex-col items-center justify-center rotate-y-180 ${!isFlipped ? 'hidden' : ''}`}>
                   <span className="text-4xl md:text-5xl font-black text-slate-900">+{pointsWon}</span>
                   <span className="text-sm font-bold text-slate-800 mt-2">ĐIỂM</span>
                </div>
              </div>
            );
          })}
        </div>

        {resultMsg && (
          <div className="flex flex-col items-center z-10 animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 mb-6">
               <p className="text-2xl font-black text-yellow-400">{resultMsg}</p>
            </div>
            <button onClick={() => { setOpenedCard(null); setPointsWon(null); setResultMsg(null); }} className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold uppercase hover:bg-slate-200">
              Chơi Lần Nữa
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CardFlipGame;

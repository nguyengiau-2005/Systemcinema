import React, { useState } from 'react';
import { gameApi } from '../api/gameApi';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { handleGameWin } from '../utils/gameUtils';

const LuckyEnvelopeGame: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [openedEnvelope, setOpenedEnvelope] = useState<number | null>(null);
  const [pointsWon, setPointsWon] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const envelopes = [0, 1, 2, 3];

  const handleOpen = async (index: number) => {
    if (playing || openedEnvelope !== null) return;
    setPlaying(true);
    setOpenedEnvelope(index);

    try {
      const response = await gameApi.spinWheel();
      
      // Delay for envelope opening animation
      setTimeout(() => {
        setPlaying(false);
        setPointsWon(response.pointsWon);
        setResultMsg(`Mở lì xì thành công! Lì xì của bạn có ${response.pointsWon} điểm!`);
        handleGameWin(response.pointsWon, response.totalLoyaltyPoints);
      }, 1200);

    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra hoặc chưa đăng nhập!");
      setPlaying(false);
      setOpenedEnvelope(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-red-950 text-white">
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center py-10 relative overflow-hidden">
        {/* Lì xì theme decorations */}
        <div className="absolute top-10 left-10 text-yellow-500 opacity-20 text-6xl">🌸</div>
        <div className="absolute bottom-10 right-10 text-yellow-500 opacity-20 text-8xl">🧧</div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-6 z-10 text-center font-serif">
          Bao Lì Xì May Mắn
        </h1>
        <p className="text-red-200 mb-12 z-10 text-center max-w-lg px-4 text-lg">
          Chọn một phong bao lì xì để nhận ngay điểm lộc đầu năm (và cả cuối năm)!
        </p>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10 z-10 mb-12 px-4 max-w-3xl">
          {envelopes.map((index) => {
            const isOpened = openedEnvelope === index && pointsWon !== null;
            const isOther = openedEnvelope !== null && openedEnvelope !== index;
            const isOpening = openedEnvelope === index && playing;

            return (
              <div 
                key={index}
                className={`relative cursor-pointer transition-all duration-700 ${isOther ? 'opacity-30 scale-90 blur-[2px]' : 'hover:-translate-y-3'}`}
                onClick={() => handleOpen(index)}
              >
                {!isOpened ? (
                   // Lì xì nguyên
                   <div className={`w-28 h-40 md:w-32 md:h-48 rounded-xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden border-2 border-red-600 bg-red-600
                     ${isOpening ? 'animate-pulse' : ''}
                   `}>
                     {/* Flap of the envelope */}
                     <div className="absolute top-0 w-full h-1/3 bg-red-700 rounded-b-[50%] shadow-md border-b border-red-800"></div>
                     <div className="mt-8 text-yellow-400 border-2 border-yellow-400 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg bg-red-700 shadow-inner z-10">
                       LỘC
                     </div>
                   </div>
                ) : (
                   // Lì xì vỡ / kết quả
                   <div className="w-28 h-40 md:w-32 md:h-48 flex flex-col items-center justify-center animate-fade-in-up bg-yellow-100 rounded-xl border border-yellow-400 shadow-2xl">
                     <span className="text-3xl md:text-4xl font-black text-red-600">+{pointsWon}</span>
                     <span className="text-sm font-bold text-red-700 mt-2">ĐIỂM</span>
                   </div>
                )}
              </div>
            );
          })}
        </div>

        {resultMsg && (
          <div className="flex flex-col items-center z-10 animate-fade-in-up">
            <div className="bg-red-900/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-red-500 mb-6 shadow-xl">
               <p className="text-2xl font-black text-yellow-400">{resultMsg}</p>
            </div>
            <button onClick={() => { setOpenedEnvelope(null); setPointsWon(null); setResultMsg(null); }} className="px-6 py-3 bg-yellow-400 text-red-900 rounded-full font-bold uppercase hover:bg-yellow-300 shadow-lg">
              Mở Thêm Bao Khác
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default LuckyEnvelopeGame;

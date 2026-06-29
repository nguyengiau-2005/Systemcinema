import confetti from 'canvas-confetti';

export const playWinSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn("Audio not supported", e);
  }
};

export const playClickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio not supported", e);
  }
};

export const handleGameWin = (pointsWon: number, totalLoyaltyPoints: number) => {
  // Phát âm thanh chiến thắng
  playWinSound();

  // Bắn pháo giấy
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);

  // Cập nhật điểm cho user trên thanh Header
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      const oldLevel = userObj.membershipLevel || 'Silver';
      
      // Backend trả về totalLoyaltyPoints
      userObj.points = totalLoyaltyPoints;
      
      // Tính toán lại hạng thành viên
      let newLevel = 'Silver';
      if (totalLoyaltyPoints >= 3000) {
        newLevel = 'Platinum';
      } else if (totalLoyaltyPoints >= 1000) {
        newLevel = 'Gold';
      }
      
      userObj.membershipLevel = newLevel;
      localStorage.setItem('user', JSON.stringify(userObj));
      window.dispatchEvent(new Event('userUpdated'));
      
      // Kiểm tra nếu thăng hạng thì bắn event hiển thị Modal thăng hạng
      if (newLevel !== oldLevel && oldLevel !== 'Platinum') {
        window.dispatchEvent(new CustomEvent('levelUp', { 
          detail: { newLevel, pointsEarned: pointsWon } 
        }));
      }

    } catch (e) {
      console.error(e);
    }
  }
};

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Film, Mic, MicOff, Star, Trash2, Calendar, Ticket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface MovieData {
  id: number;
  title: string;
  genre: string;
  poster?: string;
  rating?: number | string;
  duration?: number;
}

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  isMovieLink?: boolean;
  movieId?: number;
  type?: 'text' | 'movieCard' | 'showtimes';
  movieData?: MovieData;
  showtimes?: string[];
}

export default function CineBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [movies, setMovies] = useState<MovieData[]>([]);
  const [bookingContext, setBookingContext] = useState<MovieData | null>(null);

  // Initialize and load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cinebot_messages');
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
      if (userStr) user = JSON.parse(userStr);
    } catch (e) {}
    
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      let welcomeMsg = 'Xin chào! Mình là CineBot 🤖. Bạn muốn xem thể loại phim gì hôm nay?';
      if (user && (user.fullName || user.username)) {
        welcomeMsg = `Chào ${user.fullName || user.username}! Mình là CineBot 🤖. Rất vui được gặp lại bạn, hôm nay bạn muốn xem phim gì nào?`;
      }
      setMessages([{ id: Date.now(), text: welcomeMsg, sender: 'bot', type: 'text' }]);
    }
  }, []);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cinebot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Fetch movies
  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => setMovies(data))
      .catch(err => console.error(err));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleClearHistory = () => {
    localStorage.removeItem('cinebot_messages');
    setMessages([{ id: Date.now(), text: 'Đã xóa lịch sử trò chuyện. Bạn cần giúp gì nào?', sender: 'bot', type: 'text' }]);
    setBookingContext(null);
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      // Optional: automatically send when voice recognition ends
      // handleSend(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = (text: string = inputText) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now(), text: text, sender: 'user', type: 'text' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Advanced Mock AI Engine
    setTimeout(() => {
      const lowerInput = text.toLowerCase();
      let newMessages: Message[] = [];

      // Xử lý ngữ cảnh đặt vé (Conversational Booking)
      if (bookingContext && (lowerInput.includes('đặt') || lowerInput.includes('mua') || lowerInput.includes('xem') || lowerInput.includes('vé'))) {
        newMessages.push({
          id: Date.now(),
          text: `Bạn muốn đặt vé phim "${bookingContext.title}". Dưới đây là các suất chiếu trong ngày hôm nay:`,
          sender: 'bot',
          type: 'showtimes',
          showtimes: ['19:00', '20:30', '22:15'],
          movieId: bookingContext.id
        });
        setBookingContext(null); // Clear context sau khi show giờ chiếu
      } 
      // FAQ - Giá vé
      else if (lowerInput.includes('giá vé') || lowerInput.includes('bao nhiêu tiền')) {
        newMessages.push({ id: Date.now(), text: 'Giá vé rạp CineVerse: 2D (90k), 3D (120k), IMAX (150k). Cuối tuần phụ thu 10k/vé nhé bạn!', sender: 'bot', type: 'text' });
      } 
      // FAQ - Khuyến mãi
      else if (lowerInput.includes('khuyến mãi') || lowerInput.includes('ưu đãi')) {
        newMessages.push({ id: Date.now(), text: 'Hiện đang có ưu đãi Đồng giá 50k vào Thứ 2 hàng tuần và Giảm 20% khi mua Combo Bắp Nước qua website!', sender: 'bot', type: 'text' });
      } 
      // Gợi ý phim cá nhân
      else if (lowerInput.includes('gợi ý') || lowerInput.includes('nên xem') || lowerInput.includes('phim đang hot')) {
        const userStr = localStorage.getItem('user');
        let user = null;
        try {
          if (userStr) user = JSON.parse(userStr);
        } catch(e){}

        let suggested = movies.length > 0 ? [...movies].sort((a, b) => parseFloat(String(b.rating || 0)) - parseFloat(String(a.rating || 0)))[0] : null;
        
        if (user && suggested) {
          newMessages.push({ 
            id: Date.now(), 
            text: `Dựa trên sở thích của bạn, mình thấy siêu phẩm này rất tuyệt vời:`, 
            sender: 'bot', type: 'text' 
          });
          newMessages.push({ id: Date.now() + 1, text: '', sender: 'bot', type: 'movieCard', movieData: suggested });
          setBookingContext(suggested);
        } else if (suggested) {
          newMessages.push({ id: Date.now(), text: 'Mình gợi ý cho bạn bộ phim đang hot nhất rạp hiện nay:', sender: 'bot', type: 'text' });
          newMessages.push({ id: Date.now() + 1, text: '', sender: 'bot', type: 'movieCard', movieData: suggested });
          setBookingContext(suggested);
        } else {
          newMessages.push({ id: Date.now(), text: 'Hiện tại hệ thống chưa cập nhật phim mới, bạn quay lại sau nhé!', sender: 'bot', type: 'text' });
        }
      }
      // Khớp thể loại phim
      else {
        let matchedMovie = null;
        if (lowerInput.includes('hành động') || lowerInput.includes('action') || lowerInput.includes('đánh nhau')) {
          matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('hành động') || m.genre?.toLowerCase().includes('action'));
        } else if (lowerInput.includes('kinh dị') || lowerInput.includes('ma') || lowerInput.includes('sợ')) {
          matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('kinh dị') || m.genre?.toLowerCase().includes('horror'));
        } else if (lowerInput.includes('tình cảm') || lowerInput.includes('lãng mạn') || lowerInput.includes('yêu')) {
          matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('tình cảm') || m.genre?.toLowerCase().includes('romance'));
        } else if (lowerInput.includes('hài') || lowerInput.includes('cười')) {
          matchedMovie = movies.find(m => m.genre?.toLowerCase().includes('hài') || m.genre?.toLowerCase().includes('comedy'));
        }

        if (!matchedMovie && movies.length > 0 && lowerInput.length > 0) {
          // Tạm random 1 phim nếu không khớp
          matchedMovie = movies[Math.floor(Math.random() * movies.length)];
        }

        if (matchedMovie) {
          newMessages.push({ id: Date.now(), text: `Mình vừa tìm thấy phim này hợp với bạn! Cực kỳ hấp dẫn luôn nha.`, sender: 'bot', type: 'text' });
          newMessages.push({ id: Date.now() + 1, text: '', sender: 'bot', type: 'movieCard', movieData: matchedMovie });
          setBookingContext(matchedMovie); // Đặt context để follow-up việc mua vé
        } else {
          newMessages.push({ id: Date.now(), text: 'Xin lỗi, mình chưa tìm thấy thông tin phù hợp. Bạn thử các từ khóa như "hành động", "khuyến mãi", "giá vé" xem sao nhé!', sender: 'bot', type: 'text' });
        }
      }

      setMessages(prev => [...prev, ...newMessages]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2s delay to simulate thinking
  };

  const quickReplies = ["Phim đang hot", "Giá vé", "Khuyến mãi", "Phim hành động"];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Nút bật/tắt Bot */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(220,38,38,0.4)] cursor-pointer group"
          >
            <Bot size={28} className="group-hover:animate-bounce" />
            
            {/* Ping indicator */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cửa sổ Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-16 right-0 w-[380px] max-w-[calc(100vw-32px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col h-[550px] max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-4 flex items-center justify-between text-white shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">CineBot AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span className="text-xs text-white/80 font-medium">Trợ lý trực tuyến</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClearHistory}
                  title="Xóa lịch sử chat"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 flex items-center justify-center text-white mr-2 shrink-0 shadow-sm mt-auto">
                      <Bot size={16} />
                    </div>
                  )}
                  
                  {/* TEXT MESSAGE */}
                  {(!msg.type || msg.type === 'text') && (
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
                    }`}>
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  )}

                  {/* MOVIE CARD MESSAGE */}
                  {msg.type === 'movieCard' && msg.movieData && (
                    <div className="max-w-[85%] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-bl-none">
                      {msg.movieData.poster && (
                        <div className="relative h-40 w-full">
                          <img src={msg.movieData.poster} alt={msg.movieData.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">{msg.movieData.genre || 'Phim rạp'}</span>
                            <span className="flex items-center text-yellow-400 text-sm font-bold bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                              <Star size={14} className="mr-1 fill-yellow-400" /> {msg.movieData.rating || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{msg.movieData.title}</h4>
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => navigate(`/movies/${msg.movieData?.id}`)}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs font-bold py-2 rounded-lg transition-colors"
                          >
                            Chi tiết
                          </button>
                          <button 
                            onClick={() => {
                              setInputText(`Đặt vé phim ${msg.movieData?.title}`);
                              setTimeout(() => handleSend(`Đặt vé phim ${msg.movieData?.title}`), 100);
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Ticket size={14} /> Mua vé
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SHOWTIMES MESSAGE */}
                  {msg.type === 'showtimes' && msg.showtimes && (
                    <div className="max-w-[85%] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none shadow-sm p-3">
                      <p className="text-[15px] leading-relaxed mb-3 text-gray-800 dark:text-white">{msg.text}</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.showtimes.map((time, i) => (
                          <button 
                            key={i}
                            onClick={() => navigate(`/movies/${msg.movieId}`)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Calendar size={14} /> {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 ml-2 shrink-0 shadow-sm mt-auto">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 flex items-center justify-center text-white mr-2 shrink-0 shadow-sm mt-auto">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center shadow-sm">
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && !isTyping && (
              <div className="bg-white dark:bg-gray-900 px-3 py-2 border-t border-gray-100 dark:border-gray-800 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputText(reply);
                      handleSend(reply);
                    }}
                    className="inline-block px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-transparent focus-within:border-red-300 dark:focus-within:border-red-900 transition-colors"
              >
                <button
                  type="button"
                  onClick={handleVoice}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                    isListening 
                      ? 'bg-red-100 text-red-600 animate-pulse' 
                      : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title="Tìm kiếm bằng giọng nói"
                >
                  {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isListening ? "Đang nghe..." : "Nhập yêu cầu..."} 
                  className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-gray-800 dark:text-white placeholder-gray-500"
                />
                
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors shrink-0 shadow-sm"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </form>
            </div>
            
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .hide-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

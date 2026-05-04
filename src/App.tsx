import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, CloudRain, Lamp, Flame, Heart, Smile, Send, User, History, Plus, Inbox } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { HapticManager } from './utils/hapticManager';
import { StopMotion } from './components/StopMotion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type EmotionType = 'MISS_YOU' | 'SAD' | 'WARMTH' | 'THINKING' | 'LOVE' | 'HAPPY' | 'CUSTOM';

interface Message {
  senderId: string;
  type: EmotionType;
  text?: string;
  image?: string;
  timestamp: number;
  capsuleText?: string;
}

// --- Components ---

const SendingAnimation = ({ 
  type, 
  text, 
  image, 
  onComplete 
}: { 
  type: EmotionType, 
  text?: string, 
  image?: string, 
  onComplete: () => void 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center overflow-hidden"
    >
      <div className="relative w-80 h-96 flex items-center justify-center">
        {/* The Paper */}
        <motion.div
          initial={{ y: 400, rotate: -5, scale: 0.8 }}
          animate={{ 
            y: [400, 0, 0, 0, -200],
            rotate: [-5, 0, 0, 0, 10],
            scale: [0.8, 1, 1, 0.5, 0],
            opacity: [1, 1, 1, 1, 0]
          }}
          transition={{ 
            duration: 4,
            times: [0, 0.2, 0.6, 0.8, 1],
            ease: "easeInOut"
          }}
          onAnimationComplete={onComplete}
          className="absolute w-64 h-80 bg-white shadow-2xl p-6 hand-drawn-border flex flex-col items-center justify-center gap-4 origin-bottom"
        >
          {/* Drawing the content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-gray-800"
          >
            {getIconForType(type)}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-lg font-bold italic mb-2">{getLabelForType(type)}</p>
            {text && <p className="text-sm italic opacity-70 border-t border-gray-100 pt-2">{text}</p>}
          </motion.div>

          {image && (
            <motion.img 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              src={image} 
              className="w-32 h-32 object-cover hand-drawn-border mt-2"
              referrerPolicy="no-referrer"
            />
          )}

          {/* Folding Animation Overlays */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ times: [0, 0.6, 0.7, 0.8], duration: 4 }}
            className="absolute inset-0 bg-white/20 pointer-events-none"
          />
        </motion.div>

        {/* The Envelope */}
        <motion.div
          initial={{ y: 500, opacity: 0 }}
          animate={{ 
            y: [500, 100, 100, 100, -500],
            opacity: [0, 1, 1, 1, 0],
            rotate: [0, 0, 0, 0, -20]
          }}
          transition={{ 
            duration: 4,
            times: [0, 0.3, 0.6, 0.8, 1],
            ease: "easeInOut"
          }}
          className="absolute w-72 h-52 bg-[#e8e4da] hand-drawn-border shadow-xl flex items-center justify-center z-[-1]"
        >
          <div className="w-full h-full relative">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#dcd8cc] rounded-t-lg origin-top" />
            <Heart size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-300 opacity-50" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const HandDrawnIcon = ({ 
  icon: Icon, 
  label, 
  onClick, 
  onLongPress,
  color,
  isOffline,
  hasAfterglow 
}: { 
  icon: any, 
  label: string, 
  onClick: () => void, 
  onLongPress: () => void,
  color: string,
  isOffline?: boolean,
  hasAfterglow?: boolean
}) => {
  const [isStamping, setIsStamping] = useState(false);
  const timerRef = React.useRef<any>(null);

  const handlePointerDown = () => {
    if (isOffline) return;
    timerRef.current = setTimeout(() => {
      HapticManager.trigger('WARMTH');
      onLongPress();
      timerRef.current = null;
    }, 600);
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      handlePress();
    }
  };

  const handlePress = () => {
    if (isOffline) {
      HapticManager.trigger('WARMTH');
      return;
    }
    setIsStamping(true);
    setTimeout(() => setIsStamping(false), 300);
    onClick();
  };

  return (
    <div className="flex flex-col items-center gap-2 relative">
      {/* Afterglow Effect (Watercolor Diffusion) */}
      <AnimatePresence>
        {hasAfterglow && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-current rounded-full blur-xl pointer-events-none"
            style={{ color: color.split('-')[1] }}
          />
        )}
      </AnimatePresence>

      <motion.button 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => timerRef.current && clearTimeout(timerRef.current)}
        animate={isOffline ? { x: [0, -1, 1, -1, 1, 0] } : {}}
        transition={isOffline ? { repeat: Infinity, duration: 0.5 } : {}}
        className={cn(
          "w-20 h-20 flex items-center justify-center hand-drawn-border bg-white shadow-sm transition-all relative overflow-hidden",
          isOffline ? "grayscale opacity-50 border-gray-300" : color,
          isStamping && "scale-90 bg-gray-100 shadow-inner"
        )}
      >
        <StopMotion>
          <Icon size={32} strokeWidth={1.5} />
        </StopMotion>
        
        {/* Stamp Feedback */}
        <AnimatePresence>
          {isStamping && (
            <motion.div 
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 0.4, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-current flex items-center justify-center"
            >
               <div className="w-full h-full border-4 border-current opacity-20 rounded-full scale-150" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      <span className="text-xs font-medium opacity-70 italic">{label}</span>
    </div>
  );
};

const PaperEnvelope = ({ message, onOpen }: { message: Message, onOpen: () => void }) => {
  const [isOpened, setIsOpened] = useState(false);
  const [isStickerTorn, setIsStickerTorn] = useState(false);

  return (
    <motion.div 
      initial={{ scale: 0, y: 100, rotate: -10 }}
      animate={{ scale: 1, y: 0, rotate: 0 }}
      className="relative w-64 h-48 cursor-pointer perspective-1000"
      onClick={() => {
        if (!isOpened) {
          setIsOpened(true);
          onOpen();
        }
      }}
    >
      <AnimatePresence>
        {!isOpened ? (
          <motion.div 
            key="envelope"
            exit={{ rotateY: -180, opacity: 0, transition: { duration: 0.6 } }}
            className="absolute inset-0 bg-[#e8e4da] hand-drawn-border flex items-center justify-center shadow-lg backface-hidden"
          >
            <div className="text-center">
              <div className="w-12 h-12 mx-auto border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center mb-2">
                <Heart size={20} className="text-red-400" />
              </div>
              <p className="text-sm italic opacity-60">
                {message.capsuleText ? "预埋的温柔..." : "来自对方的信件"}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="paper"
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white p-6 hand-drawn-border shadow-xl flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-2 relative h-full">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                {getIconForType(message.type)}
                <span className="text-sm font-bold">{getLabelForType(message.type)}</span>
              </div>
              <p className="text-sm leading-relaxed italic">
                {message.text || getDefaultText(message.type)}
              </p>
              
              {message.image && (
                <img src={message.image} className="w-full h-20 object-cover hand-drawn-border mt-2" referrerPolicy="no-referrer" />
              )}

              {/* Hidden Sticker (Capsule) */}
              {message.capsuleText && (
                <AnimatePresence>
                  {!isStickerTorn ? (
                    <motion.div 
                      key="sticker"
                      exit={{ 
                        x: 200, 
                        rotate: 45, 
                        opacity: 0,
                        transition: { duration: 0.8, ease: "easeIn" }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsStickerTorn(true);
                        HapticManager.trigger('WARMTH');
                      }}
                      className="absolute inset-0 top-10 bg-[#fdf6e3] hand-drawn-border shadow-md flex items-center justify-center z-20 cursor-grab active:cursor-grabbing"
                    >
                      <div className="text-center p-4">
                        <div className="w-8 h-8 mx-auto mb-2 opacity-20">
                          <Plus size={32} className="rotate-45" />
                        </div>
                        <p className="text-[10px] font-bold italic opacity-40 uppercase tracking-widest">撕开这枚贴纸</p>
                      </div>
                      {/* Tear effect line */}
                      <div className="absolute top-0 bottom-0 right-0 w-4 border-l border-dashed border-gray-300" />
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 top-10 bg-orange-50/30 p-4 flex flex-col items-center justify-center text-center z-10"
                    >
                      <p className="text-[10px] font-bold italic text-orange-400 mb-2 uppercase tracking-widest">预埋的温柔</p>
                      <p className="text-sm italic font-medium leading-relaxed">“{message.capsuleText}”</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
            <div className="text-[10px] text-right opacity-40 mt-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const getIconForType = (type: EmotionType) => {
  switch (type) {
    case 'MISS_YOU': return <Plane size={16} />;
    case 'SAD': return <CloudRain size={16} />;
    case 'THINKING': return <Lamp size={16} />;
    case 'WARMTH': return <Flame size={16} />;
    case 'LOVE': return <Heart size={16} />;
    case 'HAPPY': return <Smile size={16} />;
    default: return <Send size={16} />;
  }
};

const getLabelForType = (type: EmotionType) => {
  switch (type) {
    case 'MISS_YOU': return '想你了';
    case 'SAD': return '有点难过';
    case 'THINKING': return '在想事情';
    case 'WARMTH': return '感到温暖';
    case 'LOVE': return '爱你';
    case 'HAPPY': return '开心';
    default: return '心情';
  }
};

const getDefaultText = (type: EmotionType) => {
  switch (type) {
    case 'MISS_YOU': return '纸飞机飞到了你那里，带着我的思念。';
    case 'SAD': return '天空下起了小雨，心里闷闷的。';
    case 'THINKING': return '台灯下的我，正在脑海里描绘你的样子。';
    case 'WARMTH': return '像冬日里的小火苗，暖烘烘的。';
    default: return '此刻的心情，想和你分享。';
  }
};

// --- Main App ---

const DisconnectAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const fireP = Array.from({ length: 24 }, (_, i) => i);
  const ashP = Array.from({ length: 36 }, (_, i) => i);
  const fireColors = ['#ff6b35', '#ff4500', '#ff8c00', '#ffd700'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center overflow-hidden"
    >
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Envelope */}
        <motion.div
          initial={{ scale: 1, rotate: 0, opacity: 1 }}
          animate={{
            scale: [1, 1.05, 0.8, 0.4, 0],
            rotate: [0, 2, -4, 10, 20],
            opacity: [1, 1, 0.6, 0.2, 0],
          }}
          transition={{ duration: 4, times: [0, 0.15, 0.35, 0.6, 1], ease: 'easeInOut' }}
          className="absolute w-52 h-40 bg-[#e8e4da] hand-drawn-border shadow-2xl flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 0.8, 0] }}
            transition={{ duration: 3, times: [0, 0.2, 0.5, 0.8] }}
          >
            <Heart size={36} className="text-red-300" />
          </motion.div>
          {/* Flame char overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.9, 0] }}
            transition={{ duration: 3.5, times: [0, 0.2, 0.5, 0.9] }}
            className="absolute inset-0 bg-gradient-to-t from-orange-500/60 via-red-500/40 to-transparent hand-drawn-border"
          />
        </motion.div>

        {/* Fire particles */}
        {fireP.map((i) => (
          <motion.div
            key={`f-${i}`}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: (Math.random() - 0.5) * 140,
              y: -Math.random() * 180 - 30,
              scale: [0, 1.2, 0.6, 0],
              opacity: [0, 0.9, 0.5, 0],
            }}
            transition={{ duration: 1.8 + Math.random() * 1.2, delay: 0.3 + Math.random() * 0.6, ease: 'easeOut' }}
            className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: fireColors[i % 4] }}
          />
        ))}

        {/* Ash particles */}
        {ashP.map((i) => (
          <motion.div
            key={`a-${i}`}
            initial={{ x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 40, opacity: 0, scale: 0 }}
            animate={{
              x: (Math.random() - 0.5) * 280,
              y: -Math.random() * 380 - 80,
              opacity: [0, 0, 1, 0.8, 0],
              scale: [0, 0, 1, 0.6, 0],
              rotate: Math.random() * 720,
            }}
            transition={{ duration: 3 + Math.random() * 2, delay: 1.2 + Math.random() * 1.5, ease: 'easeIn' }}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: ['#888', '#999', '#777', '#aaa'][i % 4] }}
          />
        ))}

        {/* Text */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: [0, 1, 0.8, 0], y: [30, 0, -10, -30] }}
          transition={{ duration: 3.5, times: [0, 0.15, 0.4, 0.8] }}
          onAnimationComplete={() => setTimeout(onComplete, 500)}
          className="absolute bottom-0 text-white/40 text-sm italic"
        >
          记忆随风散去...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [userId] = useState(() => {
    const stored = localStorage.getItem('heartbeat_userId');
    if (stored) return stored;
    const newId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('heartbeat_userId', newId);
    return newId;
  });
  const [partnerId, setPartnerId] = useState<string | null>(() => {
    return localStorage.getItem('heartbeat_partnerId') || null;
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [view, setView] = useState<'home' | 'history' | 'profile' | 'pairing' | 'mailbox'>(() => {
    return localStorage.getItem('heartbeat_partnerId') ? 'home' : 'pairing';
  });
  const [showContactModal, setShowContactModal] = useState(false);
  const [incomingMessage, setIncomingMessage] = useState<Message | null>(null);
  const [mailboxMessages, setMailboxMessages] = useState<Message[]>([]);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [customText, setCustomText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [composingType, setComposingType] = useState<EmotionType | null>(null);
  const [sendingData, setSendingData] = useState<{ type: EmotionType, text?: string, image?: string } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasAfterglow, setHasAfterglow] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [pairDate] = useState(() => new Date());
  const [myCapsules, setMyCapsules] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [myName, setMyName] = useState('');
  const [myBirthday, setMyBirthday] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerBirthday, setPartnerBirthday] = useState('');
  const [interactionCount, setInteractionCount] = useState(0);
  const [showDisconnectAnim, setShowDisconnectAnim] = useState(false);
  const deferredInstallPrompt = React.useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  // Handle 5-minute auto-move to mailbox and 24-hour expiration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Move incoming message to mailbox after 5 minutes
      if (incomingMessage && (now - incomingMessage.timestamp > 5 * 60 * 1000)) {
        setMailboxMessages(prev => [...prev, incomingMessage]);
        setIncomingMessage(null);
        setHasUnread(true);
      }

      // Expire mailbox messages after 24 hours
      setMailboxMessages(prev => prev.filter(msg => (now - msg.timestamp < 24 * 60 * 60 * 1000)));
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [incomingMessage]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt.current = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredInstallPrompt.current) return;
    deferredInstallPrompt.current.prompt();
    const result = await deferredInstallPrompt.current.userChoice;
    if (result.outcome === 'accepted') {
      setCanInstall(false);
      deferredInstallPrompt.current = null;
    }
  };

  const fetchProfile = React.useCallback(async () => {
    if (!partnerId) return;
    try {
      const [meRes, partnerRes, statsRes] = await Promise.all([
        fetch(`/api/profile/${userId}`),
        fetch(`/api/profile/partner/${userId}`),
        fetch(`/api/stats/${userId}`)
      ]);
      const me = await meRes.json();
      const partner = await partnerRes.json();
      const stats = await statsRes.json();
      if (me.name) setMyName(me.name);
      if (me.birthday) setMyBirthday(me.birthday);
      if (partner?.name) setPartnerName(partner.name);
      if (partner?.birthday) setPartnerBirthday(partner.birthday);
      setInteractionCount(stats.messageCount || 0);
    } catch {
      // Silently ignore — profile fetch is best-effort
    }
  }, [partnerId, userId]);

  // Fetch profile data whenever partner is set/changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      query: { userId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('receive_emotion', (msg: Message) => {
      setIncomingMessage(msg);
      setHasUnread(true);
      setHistory(prev => [msg, ...prev]);
      const currentTime = Date.now();
      if (currentTime - msg.timestamp < 10 * 60 * 1000) {
        HapticManager.trigger(msg.type as any || 'WARMTH');
      }
    });

    newSocket.on('capsule_used', ({ type }: { type: string }) => {
      setMyCapsules(prev => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
    });

    newSocket.on('receive_capsules', (data: Record<string, string>) => {
      setMyCapsules(data);
    });

    newSocket.on('receive_history', (data: Message[]) => {
      setHistory([...data].reverse()); // Reverse to show newest first
    });

    newSocket.on('partner_status', ({ online }) => {
      setIsPartnerOnline(online);
    });

    newSocket.on('partner_viewed_history', () => {
      setHasAfterglow(true);
      setTimeout(() => setHasAfterglow(false), 5000);
    });

    newSocket.on('connect', () => {
      // Fetch profiles after (re)connection
      fetchProfile();
    });

    newSocket.on('disconnected', () => {
      setShowDisconnectAnim(true);
    });

    setSocket(newSocket);
    newSocket.emit('get_capsules');
    newSocket.emit('get_history');
    return () => { newSocket.close(); };
  }, [userId]);

  const storeCapsule = (type: EmotionType, text: string) => {
    if (!socket) return;
    socket.emit('store_capsule', { type, text });
    setMyCapsules(prev => ({ ...prev, [type]: text }));
  };

  const generateCode = async () => {
    const res = await fetch('/api/pairing/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    setPairingCode(data.code);
  };

  const joinPairing = async () => {
    const res = await fetch('/api/pairing/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code: inputCode })
    });
    const data = await res.json();
    if (data.partnerId) {
      setPartnerId(data.partnerId);
      localStorage.setItem('heartbeat_partnerId', data.partnerId);
      setView('home');
    } else {
      alert(data.error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startSending = (type: EmotionType, text?: string, image?: string) => {
    if (!socket || !partnerId || !isOnline || isSending) return;
    setIsSending(true);
    setSendingData({ type, text, image });
    setShowCustomInput(false);
    setComposingType(null);
  };

  const finalizeSend = () => {
    if (!sendingData || !socket || !partnerId) return;
    const msg: Message = { 
      senderId: userId,
      type: sendingData.type, 
      text: sendingData.text, 
      image: sendingData.image,
      timestamp: Date.now() 
    };
    socket.emit('send_emotion', msg);
    setHistory(prev => [msg, ...prev]);
    HapticManager.trigger(sendingData.type === 'SAD' ? 'SAD' : sendingData.type === 'MISS_YOU' ? 'MISS_YOU' : 'WARMTH');
    setSendingData(null);
    setIsSending(false);
    setCustomText('');
    setSelectedImage(null);
  };

  const openHistory = () => {
    setView('history');
    setHasUnread(false);
    if (socket) socket.emit('view_history');
  };

  const openComposer = (type: EmotionType) => {
    setComposingType(type);
    setShowCustomInput(true);
  };

  const handleRequestDisconnect = () => {
    if (!socket) return;
    socket.emit('request_disconnect');
    setShowDisconnectAnim(true);
  };

  const handleDisconnectComplete = () => {
    setShowDisconnectAnim(false);
    setPartnerId(null);
    setIncomingMessage(null);
    setMailboxMessages([]);
    setHistory([]);
    setMyCapsules({});
    setMyName('');
    setMyBirthday('');
    setPartnerName('');
    setPartnerBirthday('');
    setInteractionCount(0);
    setIsPartnerOnline(false);
    localStorage.removeItem('heartbeat_partnerId');
    setView('pairing');
  };

  if (view === 'pairing' && !partnerId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 space-y-8 sm:space-y-12 paper-bg overflow-y-auto">
        <StopMotion>
          <div className="w-24 h-24 sm:w-32 sm:h-32 hand-drawn-border bg-white flex items-center justify-center rotate-3">
            <Heart size={48} className="text-red-400 fill-red-50 sm:size-64" />
          </div>
        </StopMotion>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Heartbeat Sketch</h1>
          <p className="text-sm opacity-50 italic">思念，触之即达</p>
        </div>

        <div className="w-full max-w-xs space-y-6">
          <div className="space-y-4">
            <button 
              onClick={generateCode}
              className="w-full py-4 hand-drawn-border bg-white font-bold hover:bg-gray-50 transition-colors"
            >
              生成邀请码
            </button>
            {pairingCode && (
              <div className="text-center p-4 bg-orange-50 hand-drawn-border border-orange-200 border-dashed">
                <p className="text-xs opacity-50 mb-1">分享给TA</p>
                <p className="text-2xl font-mono font-bold tracking-widest">{pairingCode}</p>
              </div>
            )}
          </div>

          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs italic">或者</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="输入TA的邀请码"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="w-full p-4 hand-drawn-border bg-white text-center font-mono focus:outline-none"
            />
            <button 
              onClick={joinPairing}
              className="w-full py-4 hand-drawn-border bg-[#4a4a4a] text-white font-bold hover:opacity-90 transition-opacity"
            >
              开启连接
            </button>
            <button 
              onClick={() => {
                setPartnerId('demo_partner');
                localStorage.setItem('heartbeat_partnerId', 'demo_partner');
                setView('home');
                setIsPartnerOnline(true);
              }}
              className="w-full py-2 text-xs italic opacity-40 hover:opacity-100 transition-opacity"
            >
              ( 演示模式：直接进入首页 )
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative paper-bg">
      <AnimatePresence>
        {sendingData && (
          <SendingAnimation
            type={sendingData.type}
            text={sendingData.text}
            image={sendingData.image}
            onComplete={finalizeSend}
          />
        )}
        {showDisconnectAnim && (
          <DisconnectAnimation onComplete={handleDisconnectComplete} />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full transition-colors",
            isPartnerOnline ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-gray-300"
          )} />
          <span className="text-xs italic opacity-50">
            {isPartnerOnline ? "对方正在云端" : "对方已离线"}
          </span>
        </div>
        <button onClick={() => setView('profile')} className="p-2 hand-drawn-border bg-white">
          <User size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto">
        <AnimatePresence>
          {incomingMessage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[2px] p-4">
              <PaperEnvelope 
                message={incomingMessage} 
                onOpen={() => {
                  setTimeout(() => setIncomingMessage(null), 3000);
                  setHasUnread(false);
                }} 
              />
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-6 sm:gap-12 mb-8 sm:mb-12">
          <HandDrawnIcon icon={Plane} label="想你" color="text-blue-400" onClick={() => startSending('MISS_YOU')} onLongPress={() => openComposer('MISS_YOU')} isOffline={!isOnline} hasAfterglow={hasAfterglow} />
          <HandDrawnIcon icon={CloudRain} label="难过" color="text-gray-400" onClick={() => startSending('SAD')} onLongPress={() => openComposer('SAD')} isOffline={!isOnline} hasAfterglow={hasAfterglow} />
          <HandDrawnIcon icon={Lamp} label="在忙" color="text-orange-400" onClick={() => startSending('THINKING')} onLongPress={() => openComposer('THINKING')} isOffline={!isOnline} hasAfterglow={hasAfterglow} />
          <HandDrawnIcon icon={Flame} label="温暖" color="text-red-400" onClick={() => startSending('WARMTH')} onLongPress={() => openComposer('WARMTH')} isOffline={!isOnline} hasAfterglow={hasAfterglow} />
          <HandDrawnIcon icon={Heart} label="爱你" color="text-pink-400" onClick={() => startSending('LOVE')} onLongPress={() => openComposer('LOVE')} isOffline={!isOnline} hasAfterglow={hasAfterglow} />
          <HandDrawnIcon icon={Smile} label="开心" color="text-yellow-400" onClick={() => startSending('HAPPY')} onLongPress={() => openComposer('HAPPY')} isOffline={!isOnline} hasAfterglow={hasAfterglow} />
        </div>

        <button 
          onClick={() => openComposer('CUSTOM')}
          className="flex items-center gap-2 px-6 py-3 hand-drawn-border bg-white text-sm italic opacity-70 hover:opacity-100 transition-opacity"
        >
          <Plus size={16} />
          自定义情绪
        </button>
      </main>

      {/* Custom Input Modal */}
      <AnimatePresence>
        {showCustomInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-[90vw] sm:max-w-sm bg-white p-6 sm:p-8 hand-drawn-border shadow-2xl space-y-6"
            >
              <h3 className="text-lg font-bold italic text-center">
                {composingType ? `发送“${getLabelForType(composingType)}”` : "此刻在想什么？"}
              </h3>
              
              <div className="space-y-4">
                <textarea 
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="写下你的心情 (限20字)..."
                  className="w-full h-24 p-4 hand-drawn-border bg-gray-50 text-sm italic focus:outline-none resize-none"
                  maxLength={20}
                />
                
                <div className="flex flex-col items-center gap-2">
                  <label className="w-full p-3 hand-drawn-border bg-white text-center text-xs italic cursor-pointer hover:bg-gray-50 transition-colors">
                    {selectedImage ? "已选择相片" : "添加一张相片"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {selectedImage && (
                    <div className="relative">
                      <img src={selectedImage} className="w-20 h-20 object-cover hand-drawn-border" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-400 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowCustomInput(false);
                    setComposingType(null);
                    setCustomText('');
                    setSelectedImage(null);
                  }}
                  className="flex-1 py-3 hand-drawn-border bg-white text-sm"
                >
                  取消
                </button>
                <button 
                  onClick={() => startSending(composingType || 'CUSTOM', customText, selectedImage || undefined)}
                  className="flex-1 py-3 hand-drawn-border bg-[#4a4a4a] text-white text-sm font-bold"
                >
                  发送
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="p-4 pb-8 flex justify-around items-end border-t border-gray-100 bg-white/50 backdrop-blur-md">
        <button 
          onClick={() => setView('home')} 
          className={cn("flex flex-col items-center gap-1 transition-colors", view === 'home' ? "text-orange-400" : "text-gray-400")}
        >
          <Heart size={24} className={view === 'home' ? "fill-orange-50" : ""} />
          <span className="text-[10px] font-bold italic">此刻</span>
        </button>
        
        <button 
          onClick={openHistory} 
          className={cn("flex flex-col items-center gap-1 transition-colors relative", view === 'history' ? "text-orange-400" : "text-gray-400")}
        >
          <History size={24} />
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full shadow-[0_0_5px_rgba(0,0,0,0.3)] animate-pulse" />
          )}
          <span className="text-[10px] font-bold italic">时光</span>
        </button>
        
        <button 
          onClick={() => setView('mailbox')} 
          className={cn("flex flex-col items-center gap-1 transition-colors relative", view === 'mailbox' ? "text-orange-400" : "text-gray-400")}
        >
          <Inbox size={24} />
          {mailboxMessages.length > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full shadow-[0_0_5px_rgba(0,0,0,0.3)] animate-pulse" />
          )}
          <span className="text-[10px] font-bold italic">信箱</span>
        </button>
      </nav>

      {/* Mailbox View Overlay */}
      <AnimatePresence>
        {view === 'mailbox' && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-[70] paper-bg flex flex-col"
          >
            <header className="p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold italic">我的信箱</h2>
              <button onClick={() => setView('home')} className="p-2 hand-drawn-border bg-white">
                <Send size={20} />
              </button>
            </header>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {mailboxMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 italic space-y-4">
                  <Inbox size={48} />
                  <p>信箱空空的，思念还在路上...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {mailboxMessages.map((msg, idx) => (
                    <div key={idx} className="flex justify-center">
                      <PaperEnvelope 
                        message={msg} 
                        onOpen={() => {
                          setMailboxMessages(prev => prev.filter((_, i) => i !== idx));
                        }} 
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-center py-8 opacity-30 italic text-[10px]">
                - 信件仅留存 24 小时，过期自动代谢 -
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History View Overlay */}
      <AnimatePresence>
        {view === 'history' && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[70] paper-bg flex flex-col"
          >
            <header className="p-6 flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-2 hand-drawn-border bg-white">
                <Send size={20} className="rotate-180" />
              </button>
              <h2 className="text-xl font-bold italic">时光长廊</h2>
            </header>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-8 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 -translate-x-1/2 border-dashed border-l"></div>
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                  <p>时光静好，暂无手稿</p>
                </div>
              ) : (
                history.map((msg, i) => (
                  <div key={i} className={cn("relative flex items-center", i % 2 === 0 ? "flex-row-reverse" : "")}>
                    <div className="w-1/2 px-4">
                      <motion.div
                        initial={{ opacity: 0, x: i % 2 === 0 ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-white hand-drawn-border shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="opacity-40">{getIconForType(msg.type)}</div>
                          <p className="text-[10px] italic opacity-60">
                            {msg.senderId === userId ? (myName || '我') : (partnerName || 'TA')}
                          </p>
                          <span className="text-[8px] opacity-30">·</span>
                          <p className="text-[10px] italic opacity-60">
                            {new Date(msg.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm italic">
                          {msg.text || getLabelForType(msg.type)}
                        </p>
                        {msg.capsuleText && (
                          <div className="mt-2 pt-2 border-t border-dashed border-orange-100">
                            <p className="text-[9px] font-bold text-orange-300 uppercase">已拆封的温柔</p>
                          </div>
                        )}
                      </motion.div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white hand-drawn-border border-gray-400 z-10"></div>
                    <div className="w-1/2"></div>
                  </div>
                ))
              )}
              <div className="text-center py-12 opacity-30 italic text-xs">
                - 仅保留最近30天的记忆 -
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile View Overlay */}
      <AnimatePresence>
        {view === 'profile' && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="fixed inset-0 z-[70] paper-bg flex flex-col"
          >
            <header className="p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold italic">个人中心</h2>
              <button onClick={() => setView('home')} className="p-2 hand-drawn-border bg-white">
                <Send size={20} />
              </button>
            </header>
            <div className="p-8 space-y-8 overflow-y-auto flex-grow">
              <div className="flex items-center justify-around p-6 bg-white hand-drawn-border relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <Heart size={200} className="absolute -top-20 -left-20 rotate-12" />
                </div>
                <div className="text-center z-10">
                  <div className="w-16 h-16 bg-blue-50 hand-drawn-border flex items-center justify-center mb-2">
                    <User size={32} />
                  </div>
                  <button onClick={() => {
                    const name = prompt('输入你的昵称', myName);
                    if (name !== null && name.trim()) {
                      setMyName(name.trim());
                      fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, name: name.trim(), birthday: myBirthday }) });
                    }
                  }} className="text-sm font-bold hover:text-orange-500 transition-colors">{myName || '我'}</button>
                  <button onClick={() => {
                    const bd = prompt('输入你的生日 (如 01.15)', myBirthday);
                    if (bd !== null && bd.trim()) {
                      setMyBirthday(bd.trim());
                      fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, name: myName, birthday: bd.trim() }) });
                    }
                  }} className="text-[10px] opacity-40 block hover:opacity-70">{myBirthday || '点击设置生日'}</button>
                </div>
                <div className="text-center z-10">
                  <StopMotion>
                    <Heart size={24} className="text-red-400 fill-red-100" />
                  </StopMotion>
                  <p className="text-[10px] opacity-40 mt-1">已连接</p>
                </div>
                <div className="text-center z-10">
                  <div className="w-16 h-16 bg-pink-50 hand-drawn-border flex items-center justify-center mb-2">
                    <User size={32} />
                  </div>
                  <p className="text-sm font-bold">{partnerName || 'TA'}</p>
                  <p className="text-[10px] opacity-40">{partnerBirthday || '--.--'}</p>
                </div>
              </div>

              <div className="p-6 bg-white hand-drawn-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm italic opacity-60">连接时长</span>
                  <span className="text-sm font-bold">
                    {Math.floor((Date.now() - pairDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} 天
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm italic opacity-60">互动次数</span>
                  <span className="text-sm font-bold">{interactionCount} 次</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-xs font-bold italic opacity-40 px-2 uppercase tracking-widest">预埋的温柔 | 情感应急胶囊</div>
                <div className="grid grid-cols-1 gap-4">
                  {(['MISS_YOU', 'SAD', 'THINKING', 'WARMTH', 'LOVE', 'HAPPY'] as EmotionType[]).map((type) => (
                    <div key={type} className="bg-white hand-drawn-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getIconForType(type)}
                          <span className="text-sm font-bold italic">{getLabelForType(type)}</span>
                        </div>
                        {myCapsules[type] ? (
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">已预埋</span>
                        ) : (
                          <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded-full font-bold">待预埋</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="输入应急话语..."
                          className="flex-grow p-2 text-xs italic hand-drawn-border bg-gray-50 focus:outline-none"
                          onChange={(e) => {
                            setMyCapsules(prev => ({ ...prev, [type]: e.target.value }));
                          }}
                          onBlur={(e) => {
                            if (e.target.value) storeCapsule(type, e.target.value);
                          }}
                          value={myCapsules[type] || ''}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-xs font-bold italic opacity-40 px-2 uppercase tracking-widest">设置与支持</div>
                {canInstall && (
                  <button
                    onClick={handleInstall}
                    className="w-full p-4 hand-drawn-border bg-white text-left text-sm italic flex justify-between items-center"
                  >
                    安装到桌面
                    <Heart size={16} />
                  </button>
                )}
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full p-4 hand-drawn-border bg-white text-left text-sm italic flex justify-between items-center"
                >
                  联系作者
                  <Send size={16} />
                </button>
                <button
                  onClick={handleRequestDisconnect}
                  className="w-full p-4 hand-drawn-border bg-red-50 text-red-500 text-left text-sm italic flex justify-between items-center hover:bg-red-100 transition-all"
                >
                  断开连接
                  <Flame size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xs bg-white hand-drawn-border p-8 space-y-6 relative"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-orange-50 hand-drawn-border flex items-center justify-center mx-auto mb-4">
                  <Send size={24} className="text-orange-400" />
                </div>
                <h3 className="text-lg font-bold italic">联系作者</h3>
                <p className="text-sm italic opacity-60">如有任何建议或反馈，欢迎致信：</p>
              </div>
              
              <div className="p-4 bg-gray-50 hand-drawn-border text-center select-all">
                <p className="text-sm font-mono font-bold break-all">kristianyu1998@outlook.com</p>
              </div>

              <button 
                onClick={() => setShowContactModal(false)}
                className="w-full py-3 hand-drawn-border bg-[#4a4a4a] text-white text-sm font-bold italic"
              >
                我知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

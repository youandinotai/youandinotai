import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Zap, Coffee, Star, Laugh } from 'lucide-react';
import HeartMascot from './HeartMascot';

interface AIMascotProps {
  context: 'welcome' | 'matching' | 'chat' | 'premium' | 'store' | 'celebration';
  userName?: string;
  className?: string;
}

const MEME_RESPONSES = {
  welcome: [
    "Welcome to the anti AI dating zone! 🤖❌",
    "Real humans only, no robots allowed! 👥",
    "Your dating algorithm is your heart ❤️",
    "No AI here, just good vibes! ✨",
    "U and I... not AI! Get it? 😏"
  ],
  matching: [
    "Cupid's got nothing on real connections! 💘",
    "Plot twist: actual human on the other side! 😱", 
    "Breaking: Real person wants to chat! 📰",
    "Your match is 100% human verified! ✅",
    "Love at first swipe... NOT first algorithm! 💕"
  ],
  chat: [
    "No AI wrote that message... probably 🤔",
    "Real conversation detected! Alert! 🚨",
    "Humans being humans? Revolutionary! 🎭",
    "Your rizz level: Authentic! 💯",
    "Chat so real, even I'm impressed! 🗣️"
  ],
  premium: [
    "Premium = See who thinks you're cute! 👀",
    "Upgrade for zero AI interference! 🚫🤖",
    "Premium features: 100% human approved! ⭐",
    "Your wallet vs premium features: Fight! 💸",
    "Premium: Because humans deserve the best! 👑"
  ],
  store: [
    "Merch so good, even AIs would buy it! 🛍️",
    "Wear your 'Not AI' status proudly! 👕",
    "Dating app merch? We did that! 😎",
    "Real clothes for real humans! 👔",
    "Shopping therapy: Human approved! 🛒"
  ],
  celebration: [
    "Another human connection unlocked! 🎉",
    "Plot armor: Successful real date! ⚔️",
    "Achievement: Touched grass with another human! 🌱",
    "Main character energy activated! ✨",
    "Victory royale in the dating game! 🏆"
  ]
};

const AI_CHARACTER_EXPRESSIONS = {
  happy: "😊",
  excited: "🤩", 
  mischievous: "😏",
  thinking: "🤔",
  celebrating: "🎉",
  love: "😍"
};

export const AIMascot: React.FC<AIMascotProps> = ({ 
  context, 
  userName = "human",
  className = "" 
}) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [expression, setExpression] = useState<keyof typeof AI_CHARACTER_EXPRESSIONS>('happy');
  const [isVisible, setIsVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messages = MEME_RESPONSES[context];
    setCurrentMessage(messages[messageIndex % messages.length]);
    
    // Random expression based on context
    const expressions: (keyof typeof AI_CHARACTER_EXPRESSIONS)[] = 
      context === 'celebration' ? ['celebrating', 'excited', 'love'] :
      context === 'premium' ? ['mischievous', 'thinking'] :
      context === 'matching' ? ['excited', 'love'] :
      ['happy', 'excited', 'mischievous'];
    
    setExpression(expressions[Math.floor(Math.random() * expressions.length)]);
    setIsVisible(true);
    
    // Auto rotate messages
    const interval = setInterval(() => {
      setMessageIndex(prev => prev + 1);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [context, messageIndex]);

  const getContextIcon = () => {
    switch(context) {
      case 'matching': return <Heart className="w-4 h-4 text-red-500" />;
      case 'chat': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'premium': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'store': return <Coffee className="w-4 h-4 text-green-500" />;
      case 'celebration': return <Zap className="w-4 h-4 text-purple-500" />;
      default: return <Laugh className="w-4 h-4 text-pink-500" />;
    }
  };

  const handleClick = () => {
    setMessageIndex(prev => prev + 1);
    // Trigger a little bounce animation
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20 
          }}
          className={`fixed bottom-4 right-4 z-50 ${className}`}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="cursor-pointer"
          >
            {/* Logo as Mascot Character */}
            <div className="relative">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                {/* Your branded character logo as the mascot */}
                <HeartMascot 
                  size="lg" 
                  className="drop-shadow-xl" 
                  expression={AI_CHARACTER_EXPRESSIONS[expression]}
                />
              </motion.div>
              
              {/* Context Icon */}
              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                {getContextIcon()}
              </div>
            </div>

            {/* Speech Bubble */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute bottom-full right-0 mb-2 max-w-xs"
            >
              <div className="bg-white rounded-lg shadow-xl border-2 border-gray-100 p-3 relative">
                <p className="text-sm font-medium text-gray-800 leading-relaxed">
                  {currentMessage}
                </p>
                <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            </motion.div>
          </motion.div>

          {/* Animated particles around logo mascot */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full border-2 border-red-300 opacity-30"
          />
          
          {/* Extra sparkle effects for celebration context */}
          {context === 'celebration' && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -20, -40],
                    x: [0, (i - 1) * 15, (i - 1) * 25],
                    opacity: [1, 0.5, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut"
                  }}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2"
                >
                  ✨
                </motion.div>
              ))}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for easy mascot integration
export const useAIMascot = (context: AIMascotProps['context']) => {
  const [showMascot, setShowMascot] = useState(false);

  useEffect(() => {
    // Show mascot after a brief delay
    const timer = setTimeout(() => setShowMascot(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const hideMascot = () => setShowMascot(false);
  const showMascotTemporarily = (duration = 5000) => {
    setShowMascot(true);
    setTimeout(() => setShowMascot(false), duration);
  };

  return { showMascot, hideMascot, showMascotTemporarily };
};

export default AIMascot;
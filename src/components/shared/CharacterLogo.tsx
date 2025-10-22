import React from 'react';

interface CharacterLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CharacterLogo: React.FC<CharacterLogoProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Clean character without background - just the hearts and geometric elements
  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main central heart - gradient from black to red */}
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="50%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="accentHeart" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        
        {/* Central heart symbol */}
        <path 
          d="M50 75L42 67C32 58 25 51 25 42C25 35 30 30 37 30C41 30 45 32 47 35C49 32 53 30 57 30C64 30 69 35 69 42C69 51 62 58 52 67L50 75Z" 
          fill="url(#heartGradient)"
          className="drop-shadow-lg"
        />
        
        {/* Inner white heart */}
        <path 
          d="M50 65L44 59C37 53 32 48 32 42C32 37 36 33 41 33C44 33 47 34 48 37C49 34 52 33 55 33C60 33 64 37 64 42C64 48 59 53 52 59L50 65Z" 
          fill="white"
        />
        
        {/* Accent heart on the side */}
        <path 
          d="M25 70L22 67C18 64 15 61 15 57C15 54 17 52 20 52C22 52 24 53 25 55C26 53 28 52 30 52C33 52 35 54 35 57C35 61 32 64 28 67L25 70Z" 
          fill="url(#accentHeart)"
          className="drop-shadow-md"
        />
        
        {/* Geometric connection dots around the character */}
        <circle cx="15" cy="20" r="2.5" fill="#dc2626" />
        <circle cx="85" cy="25" r="2.5" fill="#dc2626" />
        <circle cx="80" cy="75" r="2" fill="#7f1d1d" />
        <circle cx="25" cy="80" r="2" fill="#ef4444" />
        <circle cx="50" cy="15" r="1.5" fill="#dc2626" />
        
        {/* Subtle connection network */}
        <path 
          d="M15 20 Q30 10 50 15" 
          stroke="#dc2626" 
          strokeWidth="1" 
          fill="none" 
          opacity="0.4"
        />
        <path 
          d="M85 25 Q70 35 50 15" 
          stroke="#dc2626" 
          strokeWidth="1" 
          fill="none" 
          opacity="0.4"
        />
        <path 
          d="M25 80 Q40 65 50 75" 
          stroke="#ef4444" 
          strokeWidth="1" 
          fill="none" 
          opacity="0.3"
        />
      </svg>
    </div>
  );
};

export default CharacterLogo;
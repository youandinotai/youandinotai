import React from 'react';

interface HeartMascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  expression?: string;
}

export const HeartMascot: React.FC<HeartMascotProps> = ({ 
  size = 'md', 
  className = '',
  expression = '😊'
}) => {
  // Safeguard against undefined expression
  const safeExpression = expression || '😊';
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 120 120" 
        fill="none" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </linearGradient>
        </defs>
        
        {/* Heart Body */}
        <path 
          d="M60 95L45 80C30 66 20 56 20 42C20 30 29 20 41 20C48 20 55 24 60 30C65 24 72 20 79 20C91 20 100 30 100 42C100 56 90 66 75 80L60 95Z" 
          fill="url(#heartGradient)"
          className="drop-shadow-lg"
        />
        
        {/* T-Shirt */}
        <path 
          d="M35 35 Q45 30 60 30 Q75 30 85 35 L85 75 Q85 80 80 80 L40 80 Q35 80 35 75 Z" 
          fill="url(#shirtGradient)"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        
        {/* T-Shirt sleeves */}
        <ellipse cx="30" cy="45" rx="8" ry="15" fill="url(#shirtGradient)" stroke="#e5e7eb" strokeWidth="1"/>
        <ellipse cx="90" cy="45" rx="8" ry="15" fill="url(#shirtGradient)" stroke="#e5e7eb" strokeWidth="1"/>
        
        {/* "no Ai" Text on shirt - with prohibition circle */}
        <circle cx="60" cy="55" r="18" fill="none" stroke="#dc2626" strokeWidth="3"/>
        <line x1="45" y1="42" x2="75" y2="68" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
        
        {/* "no" text */}
        <text x="48" y="50" fontSize="8" fill="#dc2626" fontWeight="bold" fontFamily="Arial">no</text>
        
        {/* "Ai" text with heart dot on i */}
        <text x="65" y="65" fontSize="10" fill="#dc2626" fontWeight="bold" fontFamily="Arial">A</text>
        <text x="72" y="65" fontSize="10" fill="#dc2626" fontWeight="bold" fontFamily="Arial">i</text>
        
        {/* Heart dot above the i */}
        <path 
          d="M75 56L73 54C72 53 71 52 71 51C71 50 72 49 73 49C74 49 74 49 75 50C75 49 76 49 77 49C78 49 79 50 79 51C79 52 78 53 77 54L75 56Z" 
          fill="#dc2626"
        />
        
        {/* Phone in hand */}
        <rect x="80" y="65" width="12" height="18" rx="3" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
        <rect x="82" y="67" width="8" height="12" fill="#3b82f6"/>
        <circle cx="86" cy="81" r="1.5" fill="#6b7280"/>
        
        {/* Arms holding phone */}
        <path d="M75 50 Q85 55 80 65" stroke="url(#heartGradient)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        
        {/* Eyes */}
        <circle cx="52" cy="40" r="3" fill="#1f2937"/>
        <circle cx="68" cy="40" r="3" fill="#1f2937"/>
        <circle cx="53" cy="39" r="1" fill="white"/>
        <circle cx="69" cy="39" r="1" fill="white"/>
        
        {/* Expression */}
        <path d="M55 50 Q60 55 65 50" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
      
      {/* Floating expression emoji */}
      <div className="absolute -top-1 -right-1 text-lg bg-white/90 rounded-full p-1 shadow-sm">
        {safeExpression}
      </div>
    </div>
  );
};

export default HeartMascot;
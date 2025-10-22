import React from 'react';

interface BrandTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export const BrandText: React.FC<BrandTextProps> = ({ 
  size = 'md', 
  className = '',
  animated = false
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const animationClass = animated ? 'animate-pulse' : '';

  return (
    <div className={`${sizeClasses[size]} ${className} inline-flex items-center font-bold tracking-wide`}>
      <span className={`text-red-500 ${animationClass}`}>U</span>
      <span className="text-current">&</span>
      <span className={`text-red-500 relative ${animationClass}`} style={{ animationDelay: animated ? '0.25s' : undefined }}>
        i
        <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-xs text-red-500">♥</span>
      </span>
      <span className="text-current"> Not A</span>
      <span className={`text-red-500 relative ${animationClass}`} style={{ animationDelay: animated ? '1.5s' : undefined }}>
        i
        <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-xs text-red-500">♥</span>
      </span>
    </div>
  );
};

export default BrandText;
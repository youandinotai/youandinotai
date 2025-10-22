import React from 'react';
import logoImage from '@assets/modern_logo_fully_transparent.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const colors = {
    default: 'text-pink-500',
    white: 'text-white',
    dark: 'text-gray-900'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={logoImage}
        alt="U&I Not AI Character"
        className={`${sizeClasses[size]} object-contain drop-shadow-xl`}
      />
    </div>
  );
};

export default Logo;
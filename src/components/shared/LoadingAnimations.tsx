import { Heart, Flame, MessageCircle } from "lucide-react";
import Logo from "./Logo";

export function ChatLoadingBubbles() {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}

interface LoadingAnimationProps {
  type?: "hearts" | "flame" | "messages" | "logo" | "discover" | "matching";
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingAnimation({ type = 'hearts', size = 'md', text }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  if (type === 'hearts') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-2">
          <Heart className={`${sizeClasses[size]} text-red-500 animate-bounce fill-current`} style={{ animationDelay: '0ms' }} />
          <Heart className={`${sizeClasses[size]} text-pink-500 animate-bounce fill-current`} style={{ animationDelay: '200ms' }} />
          <Heart className={`${sizeClasses[size]} text-red-400 animate-bounce fill-current`} style={{ animationDelay: '400ms' }} />
        </div>
        {text && <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse font-medium">{text}</p>}
      </div>
    );
  }

  if (type === 'discover') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-red-200 border-t-red-500 rounded-full animate-spin`}></div>
          <Heart className="absolute inset-0 m-auto w-4 h-4 text-red-500 animate-pulse fill-current" />
        </div>
        {text && <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse font-medium">{text}</p>}
      </div>
    );
  }

  if (type === "flame") {
    return (
      <div className={`flex flex-col items-center justify-center ${containerSizes[size]} space-y-4`}>
        <div className="relative">
          <Flame className={`${sizeClasses[size]} text-orange-500 animate-pulse`} />
          <div className="absolute inset-0 animate-ping">
            <Flame className={`${sizeClasses[size]} text-red-500 opacity-20`} />
          </div>
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  if (type === "messages") {
    return (
      <div className={`flex flex-col items-center justify-center ${containerSizes[size]} space-y-4`}>
        <div className="relative">
          <MessageCircle className={`${sizeClasses[size]} text-red-500 animate-pulse`} />
          <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  if (type === "logo") {
    return (
      <div className={`flex flex-col items-center justify-center ${containerSizes[size]} space-y-4`}>
        <div className="animate-spin-slow">
          <Logo size="md" className="opacity-80" />
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  if (type === "matching") {
    return (
      <div className={`flex flex-col items-center justify-center ${containerSizes[size]} space-y-4`}>
        <div className="relative">
          {/* Two hearts coming together */}
          <div className="flex items-center space-x-4">
            <Heart className={`${sizeClasses[size]} text-red-500 fill-current animate-bounce-left`} />
            <div className="w-8 h-0.5 bg-red-500 animate-pulse"></div>
            <Heart className={`${sizeClasses[size]} text-red-500 fill-current animate-bounce-right`} />
          </div>
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  // Default hearts animation
  return (
    <div className={`flex flex-col items-center justify-center ${containerSizes[size]} space-y-4`}>
      <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Specialized loading components for specific use cases
export function ProfileLoadingCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function MatchCardLoading() {
  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden">
      <div className="absolute inset-0 animate-pulse">
        <div className="w-full h-3/4 bg-gray-300 dark:bg-gray-700"></div>
        <div className="p-4 space-y-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      {/* Floating hearts for dating theme */}
      <div className="absolute top-4 right-4">
        <Heart className="w-6 h-6 text-red-300 animate-ping fill-current" />
      </div>
    </div>
  );
}
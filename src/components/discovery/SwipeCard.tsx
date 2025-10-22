import { useState } from "react";
import { Heart, X, MapPin, Calendar } from "lucide-react";
import { LoadingAnimation } from "../shared/LoadingAnimations";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  profiles: Array<{
    id: number;
    photoUrl: string;
    isExplicit: boolean;
  }>;
}

interface SwipeCardProps {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
  isLoading?: boolean;
}

export default function SwipeCard({ profile, onLike, onPass, isLoading }: SwipeCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const mainPhoto = profile.profiles?.[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setDragOffset({
      x: touch.clientX - centerX,
      y: touch.clientY - centerY
    });
  };

  const handleTouchEnd = () => {
    if (Math.abs(dragOffset.x) > 100) {
      if (dragOffset.x > 0) {
        onLike?.();
      } else {
        onPass?.();
      }
    }
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  if (isLoading) {
    return (
      <div className="relative w-full max-w-sm mx-auto h-[70vh] max-h-[600px] min-h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingAnimation type="discover" size="lg" text="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full max-w-sm mx-auto h-[70vh] max-h-[600px] min-h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-stone-200 dark:border-gray-700 transition-all duration-200 ${
        isDragging ? 'scale-[1.02]' : ''
      }`}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="swipe-card"
    >
      {/* Swipe Direction Indicators */}
      {isDragging && (
        <>
          <div 
            className={`absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-opacity duration-200 z-10 ${
              dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            LIKE
          </div>
          <div 
            className={`absolute top-6 right-6 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-opacity duration-200 z-10 ${
              dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            PASS
          </div>
        </>
      )}

      {/* Main Photo */}
      <div className="relative h-3/5 bg-stone-100 dark:bg-gray-700">
        {mainPhoto && !imageError ? (
          <img
            src={mainPhoto.photoUrl}
            alt={`${profile.firstName}'s photo`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-gray-700">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-2 bg-stone-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">📷</span>
              </div>
              <p className="text-sm">No photo available</p>
            </div>
          </div>
        )}
        
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-gray-700">
            <LoadingAnimation type="discover" size="md" text="Loading..." />
          </div>
        )}

        {/* Action Buttons Overlay */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
          <button
            onClick={onPass}
            className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all touch-manipulation border border-stone-200 dark:border-gray-700"
            disabled={isLoading}
            data-testid="button-pass"
          >
            <X className="w-6 h-6 text-slate-700 dark:text-gray-300" />
          </button>
          <button
            onClick={onLike}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all touch-manipulation"
            disabled={isLoading}
            data-testid="button-like"
          >
            <Heart className="w-6 h-6 text-white fill-current" />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="h-2/5 p-4 flex flex-col justify-between bg-white dark:bg-gray-800">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate">
              {profile.firstName}, {profile.age}
            </h3>
          </div>
          
          <div className="flex items-center text-slate-600 dark:text-gray-400 mb-2">
            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="text-sm truncate">{profile.location}</span>
          </div>

          <p className="text-sm text-slate-700 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
            {profile.bio}
          </p>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-stone-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-xs rounded-full font-medium"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 3 && (
                <span className="px-2.5 py-1 bg-stone-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 text-xs rounded-full font-medium">
                  +{profile.interests.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Swipe Instructions */}
        <div className="text-center text-xs text-slate-500 dark:text-gray-400 mt-2 border-t border-stone-200 dark:border-gray-700 pt-2">
          Swipe right to like • Swipe left to pass
        </div>
      </div>
    </div>
  );
}
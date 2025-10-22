import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: User | null;
  currentUser: User | null;
  onStartChat: () => void;
}

export default function MatchModal({
  isOpen,
  onClose,
  matchedUser,
  currentUser,
  onStartChat,
}: MatchModalProps) {
  if (!isOpen || !matchedUser || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 via-black to-gray-900 flex items-center justify-center z-50 p-4">
      <div className="text-center text-white max-w-sm w-full">
        <div className="text-6xl mb-6 animate-pulse">
          <Heart className="w-16 h-16 fill-white text-white mx-auto" />
        </div>
        <h2 className="text-3xl font-bold mb-4">It's a Match!</h2>
        <p className="text-lg mb-8">
          You and {matchedUser.firstName} liked each other
        </p>

        <div className="flex justify-center space-x-4 mb-8">
          {/* Current user profile image */}
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white">
            <img
              src={
                currentUser.profileImageUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`
              }
              alt="Your profile"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Matched user profile image */}
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white">
            <img
              src={
                matchedUser.profileImageUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchedUser.id}`
              }
              alt="Match profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={onStartChat}
            className="w-full bg-white text-red-500 py-4 rounded-full font-semibold text-lg shadow-lg hover:bg-gray-50"
          >
            Send Message
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-2 border-white text-white py-4 rounded-full font-semibold bg-transparent hover:bg-white/10"
          >
            Keep Swiping
          </Button>
        </div>
      </div>
    </div>
  );
}

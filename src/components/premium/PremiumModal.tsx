import { Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const [, setLocation] = useLocation();

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setLocation('/subscribe');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X className="w-5 h-5 text-gray-400 dark:text-gray-300" />
        </button>

        <div className="text-center mb-6">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Upgrade to Premium</h3>
          <p className="text-gray-600 dark:text-gray-300">Unlock all features and find love faster</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">See who liked you</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">Read receipts</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">Exchange contact info</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <span className="text-gray-700">View unblurred content</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-black text-white p-4 rounded-2xl mb-6 text-center">
          <div className="text-3xl font-bold">$9.99</div>
          <div className="text-sm opacity-90">per week</div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSubscribe}
            className="w-full bg-red-500 text-white py-4 rounded-full font-semibold text-lg hover:bg-red-600"
          >
            Start Premium
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-500 py-2"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}

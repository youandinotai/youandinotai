import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Heart, 
  MessageCircle, 
  Crown, 
  ShoppingBag,
  Zap,
  Eye,
  Users,
  Globe
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;

  icon: React.ReactNode;
  highlightElement?: string;
  action?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to U&i Not Ai!',
    description: 'The dating app where real humans connect without algorithms interfering.',

    icon: <Heart className="w-6 h-6 text-red-500" />,
  },
  {
    id: 'swipe',
    title: 'Discover Real People',
    description: 'Swipe through profiles of verified humans. No bots, no AI-generated profiles.',

    icon: <Users className="w-6 h-6 text-blue-500" />,
    highlightElement: '.swipe-card',
    action: 'Try swiping on a profile!'
  },
  {
    id: 'matching',
    title: 'Real Connections',
    description: 'When two people like each other, it\'s a match! Start chatting immediately.',

    icon: <Zap className="w-6 h-6 text-yellow-500" />,
  },
  {
    id: 'chat',
    title: 'Unlimited Messaging',
    description: 'Chat freely with your matches. Every message is from a real human.',

    icon: <MessageCircle className="w-6 h-6 text-green-500" />,
    highlightElement: '.chat-interface',
  },
  {
    id: 'premium',
    title: 'Premium Features',
    description: 'Choose from 3 monthly plans: Basic ($9.99), Premium ($19.99), or Elite ($29.99) with features like Super Likes, Profile Boosts, and Incognito Mode.',

    icon: <Crown className="w-6 h-6 text-purple-500" />,
    action: 'Check out premium features'
  },
  {
    id: 'privacy',
    title: 'Your Privacy Matters',
    description: 'We protect your data and never share it with AI training models.',

    icon: <Eye className="w-6 h-6 text-indigo-500" />,
  },
  {
    id: 'global',
    title: 'Worldwide Connections',
    description: 'Connect with humans from around the globe or in your local area.',

    icon: <Globe className="w-6 h-6 text-teal-500" />,
  },
  {
    id: 'store',
    title: 'Official Merchandise',
    description: 'Show your anti-AI dating pride with our branded merchandise.',

    icon: <ShoppingBag className="w-6 h-6 text-orange-500" />,
    action: 'Visit the store'
  },
  {
    id: 'complete',
    title: 'Ready to Find Love!',
    description: 'You\'re all set! Start swiping and find your perfect human match.',

    icon: <Heart className="w-6 h-6 text-pink-500" />,
    action: 'Start dating!'
  }
];

interface OnboardingTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTutorial({ isVisible, onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleAction = () => {
    const step = currentStepData;
    if (step.action) {
      switch (step.id) {
        case 'premium':
          // Navigate to premium page
          window.location.href = '/subscribe';
          break;
        case 'store':
          // Navigate to store
          window.location.href = '/store';
          break;
        case 'complete':
          onComplete();
          break;
        default:
          handleNext();
      }
    } else {
      handleNext();
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-md w-full"
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          dragElastic={0.3}
          onDragEnd={(event, info) => {
            const threshold = 80;
            if (Math.abs(info.offset.x) > threshold) {
              if (info.offset.x > 0 && !isFirstStep) {
                handlePrevious();
              } else if (info.offset.x < 0 && !isLastStep) {
                handleNext();
              } else if (info.offset.x < 0 && isLastStep) {
                onComplete();
              }
            }
          }}
        >
          {/* Skip Button */}
          <button
            onClick={onSkip}
            className="absolute -top-12 right-0 text-white/80 hover:text-white flex items-center space-x-2 text-sm"
          >
            <span>Skip tutorial</span>
            <X className="w-4 h-4" />
          </button>

          <Card className="bg-white dark:bg-gray-800 shadow-2xl border-0">
            <CardContent className="p-6">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                <motion.div
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Simple Icon Display */}
              <div className="flex justify-center mb-6">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl"
                >
                  {currentStepData.icon}
                </motion.div>
              </div>



              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-4"
                >
                  <div className="flex items-center justify-center space-x-3">
                    {currentStepData.icon}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentStepData.title}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {currentStepData.description}
                  </p>

                  {currentStepData.action && (
                    <Badge variant="secondary" className="mt-2">
                      {currentStepData.action}
                    </Badge>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Simple Navigation - Swipe Instructions */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  👈 Swipe left for next • Swipe right for previous 👉
                </p>
                
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={isFirstStep}
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex space-x-1">
                    {ONBOARDING_STEPS.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentStep ? 'bg-red-500 scale-125' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={isLastStep ? onComplete : handleNext}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Step Counter */}
              <div className="text-center mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboarding_completed');
    if (!completed) {
      setShowOnboarding(true);
    } else {
      setHasCompletedOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding_completed', 'true');
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding_completed', 'true');
  };

  const resetOnboarding = () => {
    setShowOnboarding(true);
    setHasCompletedOnboarding(false);
    localStorage.removeItem('onboarding_completed');
  };

  return {
    showOnboarding,
    hasCompletedOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
}
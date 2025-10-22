import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play } from 'lucide-react';
import { useOnboarding } from './OnboardingTutorial';

export default function OnboardingTestButton() {
  const { resetOnboarding, hasCompletedOnboarding } = useOnboarding();

  return (
    <Button
      onClick={resetOnboarding}
      variant="outline"
      size="sm"
      className="fixed bottom-4 left-4 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
      title={hasCompletedOnboarding ? "Restart Onboarding Tutorial" : "Show Onboarding Tutorial"}
    >
      {hasCompletedOnboarding ? (
        <>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Tutorial
        </>
      ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          Start Tutorial
        </>
      )}
    </Button>
  );
}
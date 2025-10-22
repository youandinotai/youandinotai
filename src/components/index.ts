// Re-export all components for easy importing

// Auth components
// export * from './auth';

// Profile components
export { default as ProfileEditor } from './profile/ProfileEditor';
export { ObjectUploader } from './profile/ObjectUploader';

// Discovery components
export { default as LocationSearch } from './discovery/LocationSearch';
export { default as SwipeCard } from './discovery/SwipeCard';

// Chat components
export { default as ChatInterface } from './chat/ChatInterface';
export { default as MatchModal } from './chat/MatchModal';

// Premium components
export { default as PremiumModal } from './premium/PremiumModal';

// Admin components
// export * from './admin';

// Shared components
export { default as Logo } from './shared/Logo';
export { default as BrandText } from './shared/BrandText';
export { default as CharacterLogo } from './shared/CharacterLogo';
export { default as HeartMascot } from './shared/HeartMascot';
export { default as AIMascot } from './shared/AIMascot';
export { ThemeProvider } from './shared/ThemeProvider';
export { LoadingAnimation } from './shared/LoadingAnimations';
export { default as OnboardingTutorial } from './shared/OnboardingTutorial';
export { default as OnboardingTestButton } from './shared/OnboardingTestButton';
export { AchievementSystem } from './shared/AchievementSystem';

// Export LoadingAnimations as alias for backward compatibility
export { LoadingAnimation as LoadingAnimations } from './shared/LoadingAnimations';

// UI components (shadcn)
export * from './ui/button';
export * from './ui/card';
export * from './ui/input';
export * from './ui/toast';
// ... add more as needed

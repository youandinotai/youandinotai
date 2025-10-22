import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Target, 
  Crown, 
  Heart, 
  User, 
  Camera, 
  MessageCircle,
  Zap,
  Award,
  TrendingUp,
  CheckCircle,
  Lock
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  requirement: {
    type: string;
    threshold: number;
  };
}

interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  achievement: Achievement;
}

interface ProfileStats {
  completenessScore: number;
  totalPoints: number;
  profileViews: number;
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  star: Star,
  target: Target,
  crown: Crown,
  heart: Heart,
  user: User,
  camera: Camera,
  message: MessageCircle,
  zap: Zap,
  award: Award,
  trending: TrendingUp,
  check: CheckCircle,
};

export function AchievementSystem() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  const { data: userAchievements = [] } = useQuery<UserAchievement[]>({
    queryKey: ['/api/achievements/user'],
  });

  const { data: profileStats } = useQuery<ProfileStats>({
    queryKey: ['/api/profile/stats'],
  });

  const categories = ['all', 'profile', 'social', 'premium'];
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedAchievements = new Set(userAchievements.map(ua => ua.achievementId));
  const totalPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

  const getProgressForAchievement = (achievement: Achievement): number => {
    if (unlockedAchievements.has(achievement.id)) return 100;
    
    if (achievement.requirement.type === 'profile_complete' && profileStats) {
      return Math.min((profileStats.completenessScore / achievement.requirement.threshold) * 100, 100);
    }
    
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Achievement Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-1">
                  Achievements
                </h2>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Complete your profile to unlock rewards
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
                {totalPoints}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Points
              </div>
            </div>
          </div>

          {/* Profile Completeness */}
          {profileStats && (
            <div className="bg-white/30 dark:bg-gray-800/30 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Profile Completeness
                </h3>
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700/30 font-bold">
                  {profileStats.completenessScore}%
                </Badge>
              </div>
              <Progress 
                value={profileStats.completenessScore} 
                className="h-3 bg-gray-200 dark:bg-gray-700"
              />
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                {profileStats.completenessScore < 100 
                  ? `${100 - profileStats.completenessScore}% left to complete your profile`
                  : 'Your profile is complete! 🎉'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setSelectedCategory(category)}
            variant={selectedCategory === category ? "default" : "secondary"}
            size="sm"
            className={`
              min-w-fit whitespace-nowrap transition-all duration-300 font-bold
              ${selectedCategory === category 
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg scale-105' 
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700/80'
              }
            `}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAchievements.map((achievement) => {
          const IconComponent = iconMap[achievement.icon] || Trophy;
          const isUnlocked = unlockedAchievements.has(achievement.id);
          const progress = getProgressForAchievement(achievement);
          
          return (
            <div
              key={achievement.id}
              className={`
                group relative overflow-hidden rounded-3xl backdrop-blur-xl border shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl
                ${isUnlocked 
                  ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/30' 
                  : 'bg-white/60 dark:bg-gray-800/60 border-white/30 dark:border-gray-700/30'
                }
              `}
            >
              <div className={`
                absolute inset-0 transition-opacity duration-300
                ${isUnlocked 
                  ? 'bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-100' 
                  : 'bg-gradient-to-br from-gray-500/5 via-transparent to-gray-600/5 opacity-0 group-hover:opacity-100'
                }
              `}></div>
              
              <div className="relative p-6">
                <div className="flex items-start space-x-4">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110
                    ${isUnlocked 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }
                  `}>
                    {isUnlocked ? (
                      <IconComponent className="w-8 h-8 text-white" />
                    ) : (
                      <Lock className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`
                        text-lg font-black transition-colors duration-300
                        ${isUnlocked 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-gray-700 dark:text-gray-300'
                        }
                      `}>
                        {achievement.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {isUnlocked && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        <Badge className={`
                          font-bold
                          ${isUnlocked 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700/30' 
                            : 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600/30'
                          }
                        `}>
                          {achievement.points} pts
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                      {achievement.description}
                    </p>
                    
                    {!isUnlocked && progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            Progress
                          </span>
                          <span className="text-gray-800 dark:text-gray-200 font-bold">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2 bg-gray-200 dark:bg-gray-700"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
            No achievements found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Complete your profile to start earning achievements!
          </p>
        </div>
      )}
    </div>
  );
}
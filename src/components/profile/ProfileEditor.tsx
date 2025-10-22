import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, X, Plus, MapPin, Calendar, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  location?: string;
  bio?: string;
  interests?: string[];
  profileImageUrl?: string;
  isPremium?: boolean;
}

interface ProfileEditorProps {
  user: User;
  onClose: () => void;
  isOpen: boolean;
}

const SUGGESTED_INTERESTS = [
  'Travel', 'Photography', 'Music', 'Sports', 'Cooking', 'Reading',
  'Movies', 'Fitness', 'Art', 'Gaming', 'Dancing', 'Hiking',
  'Fashion', 'Technology', 'Coffee', 'Wine', 'Yoga', 'Pets',
  'Adventure', 'Comedy', 'Nature', 'Culture', 'Learning'
];

export default function ProfileEditor({ user, onClose, isOpen }: ProfileEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    age: user.age || '',
    location: user.location || '',
    bio: user.bio || '',
    interests: user.interests || []
  });

  const [newInterest, setNewInterest] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', '/api/profile', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addInterest = (interest: string) => {
    if (interest && !formData.interests.includes(interest) && formData.interests.length < 10) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const handleSubmit = () => {
    updateProfileMutation.mutate(formData);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('isExplicit', 'false');
      formData.append('isPrivate', 'false');

      const response = await fetch('/api/profile/photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Refresh photos and user profile
        await fetchPhotos();
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        toast({
          title: "Photo uploaded successfully!",
          description: "Your new photo has been added to your profile.",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/profile/photos', {
        credentials: 'include',
      });
      if (response.ok) {
        const photos = await response.json();
        // Refresh user data to show updated profile
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Photo */}
          <div className="text-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-gray-200">
              <img
                src={user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <label htmlFor="photo-upload">
              <Button variant="outline" size="sm" asChild>
                <Camera className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            </label>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Age
                </label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || '')}
                  placeholder="Enter age"
                  min="18"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/500 characters
              </div>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Heart className="w-4 h-4 inline mr-1" />
              Interests ({formData.interests.length}/10)
            </label>

            {/* Current Interests */}
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.interests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Add Custom Interest */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add a custom interest..."
                onKeyPress={(e) => e.key === 'Enter' && addInterest(newInterest)}
              />
              <Button
                size="sm"
                onClick={() => addInterest(newInterest)}
                disabled={!newInterest || formData.interests.length >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Suggested Interests */}
            <div>
              <div className="text-xs text-gray-500 mb-2">Suggested interests:</div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_INTERESTS.filter(interest => !formData.interests.includes(interest))
                  .slice(0, 8).map((interest) => (
                  <button
                    key={interest}
                    onClick={() => addInterest(interest)}
                    disabled={formData.interests.length >= 10}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider as UISlider } from '@/components/ui/slider';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  location?: string;
  bio?: string;
  interests?: string[];
  profileImageUrl?: string;
  distance?: number;
  profiles: { photoUrl: string }[];
}

interface LocationSearchProps {
  onUserSelect?: (user: User) => void;
}

export default function LocationSearch({ onUserSelect }: LocationSearchProps) {
  const { toast } = useToast();
  const [searchCity, setSearchCity] = useState('');
  const [searchRadius, setSearchRadius] = useState([25]);
  const [isSearching, setIsSearching] = useState(false);

  const [searchResults, setSearchResults] = useState<User[]>([]);

  const handleSearch = async () => {
    if (!searchCity.trim()) {
      toast({
        title: "Enter a city",
        description: "Please enter a city name to search for users.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiRequest('GET', `/api/search/location?city=${encodeURIComponent(searchCity)}&radius=${searchRadius[0]}`);
      const users = await response.json();
      
      setSearchResults(users);
      
      toast({
        title: "Search completed",
        description: `Found ${users.length} users within ${searchRadius[0]} miles of ${searchCity}`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Failed to search for users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use coordinates for more accurate search
            const { latitude, longitude } = position.coords;
            const response = await apiRequest('GET', `/api/search/location?radius=${searchRadius[0]}`);
            const users = await response.json();
            
            setSearchResults(users);
            
            toast({
              title: "Location search completed",
              description: `Found ${users.length} users within ${searchRadius[0]} miles of your location`,
            });
          } catch (error) {
            console.error('Location search error:', error);
            toast({
              title: "Location search failed",
              description: "Failed to search using your location. Please try searching by city.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          toast({
            title: "Location access denied",
            description: "Please enable location access or search by city name.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services. Please search by city.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Search by Location
        </h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter city name..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Search Radius</label>
              <span className="text-sm text-gray-500">{searchRadius[0]} miles</span>
            </div>
            <UISlider
              value={searchRadius}
              onValueChange={setSearchRadius}
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          <Button 
            variant="outline" 
            onClick={handleLocationRequest}
            className="w-full"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Use My Current Location
          </Button>
        </div>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Search Results ({searchResults.length})
          </h3>
          
          {searchResults.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No users found in the specified area. Try expanding your search radius or searching a different city.
            </p>
          ) : (
            <div className="grid gap-4">
              {searchResults.map((user: User) => (
                <div 
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => onUserSelect?.(user)}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={user.profiles?.[0]?.photoUrl || user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                      alt={`${user.firstName}'s profile`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h4>
                        {user.distance && (
                          <Badge variant="secondary" className="text-xs">
                            {user.distance} miles away
                          </Badge>
                        )}
                      </div>
                      
                      {user.age && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Age {user.age}
                        </p>
                      )}
                      
                      {user.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.location}
                        </p>
                      )}
                      
                      {user.bio && (
                        <p className="text-sm mt-2 line-clamp-2">{user.bio}</p>
                      )}
                      
                      {user.interests && user.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {user.interests.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.interests.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
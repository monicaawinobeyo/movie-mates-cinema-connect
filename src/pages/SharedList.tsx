
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MovieCard from '@/components/movies/MovieCard';
import { UserListItem } from '@/types/supabase';
import { Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface SharedMediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  vote_average?: number;
}

const SharedList = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedItems, setSharedItems] = useState<SharedMediaItem[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [listType, setListType] = useState<'to_watch' | 'watched' | 'favorite'>('to_watch');
  
  useEffect(() => {
    const fetchSharedList = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams(location.search);
        const sharedUserId = queryParams.get('user');
        const sharedListType = queryParams.get('type') as 'to_watch' | 'watched' | 'favorite';
        
        if (!sharedUserId || !sharedListType) {
          setError('Invalid sharing link. Missing user ID or list type.');
          return;
        }
        
        setListType(sharedListType);
        
        // Check if list is public or if current user is the owner
        const isOwner = user?.id === sharedUserId;
        const isPublic = true; // In a real implementation, check if list is public
        
        if (!isPublic && !isOwner) {
          setError('This list is private and not available for viewing.');
          return;
        }
        
        // Fetch profile info
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', sharedUserId)
          .maybeSingle();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Failed to load user profile.');
          return;
        }
        
        setProfileName(profileData?.username || 'User');
        
        // Fetch the list items
        const { data: listData, error: listError } = await supabase
          .from('user_lists')
          .select('*')
          .eq('user_id', sharedUserId)
          .eq('list_type', sharedListType);
          
        if (listError) {
          console.error('Error fetching list:', listError);
          setError('Failed to load shared list.');
          return;
        }
        
        // If list is empty
        if (!listData || listData.length === 0) {
          setError('This list is empty.');
          return;
        }
        
        // Fetch media details for each item
        const userItems = listData as UserListItem[];
        const mediaDetails = await Promise.all(
          userItems.map(async (item) => {
            try {
              let details: any;
              if (item.media_type === 'movie') {
                details = await api.getMovieDetails(item.media_id);
              } else {
                details = await api.getTVShowDetails(item.media_id);
              }
              
              return {
                ...details,
                media_type: item.media_type,
                id: details.id,
                title: 'title' in details ? details.title : undefined,
                name: 'name' in details ? details.name : undefined,
                poster_path: details.poster_path,
                vote_average: details.vote_average
              } as SharedMediaItem;
            } catch (error) {
              console.error(`Error fetching details for ${item.media_type} ${item.media_id}:`, error);
              return null;
            }
          })
        );
        
        // Filter out any failed requests
        setSharedItems(mediaDetails.filter(Boolean) as SharedMediaItem[]);
        
      } catch (error) {
        console.error('Error loading shared list:', error);
        setError('Failed to load shared list. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedList();
  }, [location.search, user, toast]);
  
  const formatListType = (type: 'to_watch' | 'watched' | 'favorite'): string => {
    switch (type) {
      case 'to_watch':
        return 'To Watch';
      case 'watched':
        return 'Watched';
      case 'favorite':
        return 'Favorites';
      default:
        return type;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <Lock className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {profileName}'s {formatListType(listType)} List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sharedItems.map((item) => (
              <MovieCard
                key={`${item.media_type}-${item.id}`}
                title={item.title || item.name || ''}
                posterPath={item.poster_path}
                id={item.id}
                type={item.media_type}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedList;

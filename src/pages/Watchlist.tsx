
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MovieCard from '@/components/movies/MovieCard';
import { api, getPosterUrl } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Movie, TVShow } from '@/types/tmdb';

interface UserListItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  list_type: 'watched' | 'favorite' | 'to_watch';
}

const Watchlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [watched, setWatched] = useState<(Movie | TVShow)[]>([]);
  const [favorites, setFavorites] = useState<(Movie | TVShow)[]>([]);
  const [toWatch, setToWatch] = useState<(Movie | TVShow)[]>([]);
  
  useEffect(() => {
    const fetchUserLists = async () => {
      if (!user) return;
      
      try {
        const { data: userListData, error } = await supabase
          .from('user_lists')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const watchedItems: UserListItem[] = userListData.filter(item => item.list_type === 'watched');
        const favoriteItems: UserListItem[] = userListData.filter(item => item.list_type === 'favorite');
        const toWatchItems: UserListItem[] = userListData.filter(item => item.list_type === 'to_watch');
        
        // Fetch details for all media items
        await Promise.all([
          fetchMediaDetails(watchedItems, setWatched),
          fetchMediaDetails(favoriteItems, setFavorites),
          fetchMediaDetails(toWatchItems, setToWatch)
        ]);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        toast({
          title: "Error loading watchlist",
          description: "Could not load your watchlist. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserLists();
  }, [user, toast]);
  
  const fetchMediaDetails = async (
    items: UserListItem[], 
    setItems: React.Dispatch<React.SetStateAction<(Movie | TVShow)[]>>
  ) => {
    if (items.length === 0) return;
    
    const detailsPromises = items.map(async (item) => {
      try {
        let details;
        if (item.media_type === 'movie') {
          details = await api.getMovieDetails(item.media_id);
        } else {
          details = await api.getTVShowDetails(item.media_id);
        }
        return { ...details, media_type: item.media_type };
      } catch (error) {
        console.error(`Error fetching details for ${item.media_type} ${item.media_id}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(detailsPromises);
    setItems(results.filter(Boolean) as (Movie | TVShow)[]);
  };
  
  const handleRemoveFromList = async (mediaId: number, mediaType: 'movie' | 'tv', listType: 'watched' | 'favorite' | 'to_watch') => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .eq('list_type', listType);
      
      if (error) throw error;
      
      // Update local state
      if (listType === 'watched') {
        setWatched(prev => prev.filter(item => item.id !== mediaId));
      } else if (listType === 'favorite') {
        setFavorites(prev => prev.filter(item => item.id !== mediaId));
      } else {
        setToWatch(prev => prev.filter(item => item.id !== mediaId));
      }
      
      toast({
        title: "Removed from list",
        description: `Removed from your ${listType.replace('_', ' ')} list`,
      });
    } catch (error) {
      console.error('Error removing from list:', error);
      toast({
        title: "Error",
        description: "Could not remove item from list",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p>Loading your lists...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Watchlist</h1>
      
      <Tabs defaultValue="to-watch" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="to-watch">To Watch</TabsTrigger>
          <TabsTrigger value="watched">Watched</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="to-watch">
          {toWatch.length === 0 ? (
            <Alert>
              <AlertDescription>
                You haven't added any movies or TV shows to your "To Watch" list yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {toWatch.map((item) => (
                <MovieCard
                  key={`${item.media_type}-${item.id}`}
                  id={item.id}
                  title={'title' in item ? item.title : item.name}
                  posterPath={item.poster_path}
                  type={item.media_type as 'movie' | 'tv'}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="watched">
          {watched.length === 0 ? (
            <Alert>
              <AlertDescription>
                You haven't marked any movies or TV shows as watched yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watched.map((item) => (
                <MovieCard
                  key={`${item.media_type}-${item.id}`}
                  id={item.id}
                  title={'title' in item ? item.title : item.name}
                  posterPath={item.poster_path}
                  type={item.media_type as 'movie' | 'tv'}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites">
          {favorites.length === 0 ? (
            <Alert>
              <AlertDescription>
                You haven't added any movies or TV shows to your favorites yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favorites.map((item) => (
                <MovieCard
                  key={`${item.media_type}-${item.id}`}
                  id={item.id}
                  title={'title' in item ? item.title : item.name}
                  posterPath={item.poster_path}
                  type={item.media_type as 'movie' | 'tv'}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Watchlist;


import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import MovieCard from '@/components/movies/MovieCard';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Movie, TVShow } from '@/types/tmdb';
import { UserListItem } from '@/types/supabase';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// Define a type that combines Movie and TVShow with a media_type field
interface MediaItemWithType {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genres?: { id: number; name: string }[];
}

type SortOption = 'latest' | 'oldest' | 'rating-high' | 'rating-low' | 'title-asc' | 'title-desc';

const Watchlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [watched, setWatched] = useState<MediaItemWithType[]>([]);
  const [favorites, setFavorites] = useState<MediaItemWithType[]>([]);
  const [toWatch, setToWatch] = useState<MediaItemWithType[]>([]);
  const [activeTab, setActiveTab] = useState<string>('to-watch');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchUserLists = async () => {
      if (!user) return;
      
      try {
        const { data: userListData, error } = await supabase
          .from('user_lists')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Define the items with the correct type
        const userItems = userListData as UserListItem[];
        
        const watchedItems = userItems.filter(item => item.list_type === 'watched');
        const favoriteItems = userItems.filter(item => item.list_type === 'favorite');
        const toWatchItems = userItems.filter(item => item.list_type === 'to_watch');
        
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
    setItems: React.Dispatch<React.SetStateAction<MediaItemWithType[]>>
  ) => {
    if (items.length === 0) return;
    
    const detailsPromises = items.map(async (item) => {
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
          vote_average: details.vote_average,
          release_date: details.release_date,
          first_air_date: details.first_air_date,
          genres: details.genres
        } as MediaItemWithType;
      } catch (error) {
        console.error(`Error fetching details for ${item.media_type} ${item.media_id}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(detailsPromises);
    setItems(results.filter(Boolean) as MediaItemWithType[]);
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
        setWatched(prev => prev.filter(item => item.id !== mediaId || item.media_type !== mediaType));
      } else if (listType === 'favorite') {
        setFavorites(prev => prev.filter(item => item.id !== mediaId || item.media_type !== mediaType));
      } else {
        setToWatch(prev => prev.filter(item => item.id !== mediaId || item.media_type !== mediaType));
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

  const moveToList = async (item: MediaItemWithType, targetList: 'watched' | 'favorite' | 'to_watch') => {
    if (!user) return;
    
    // First, determine current list
    let currentList: 'watched' | 'favorite' | 'to_watch';
    
    if (watched.some(watchedItem => watchedItem.id === item.id && watchedItem.media_type === item.media_type)) {
      currentList = 'watched';
    } else if (favorites.some(favItem => favItem.id === item.id && favItem.media_type === item.media_type)) {
      currentList = 'favorite';
    } else {
      currentList = 'to_watch';
    }
    
    // If already in the target list, do nothing
    if (currentList === targetList) return;
    
    try {
      // Remove from current list
      await handleRemoveFromList(item.id, item.media_type, currentList);
      
      // Add to new list
      const { error } = await supabase
        .from('user_lists')
        .insert([{
          user_id: user.id,
          media_id: item.id,
          media_type: item.media_type,
          list_type: targetList
        }]);
      
      if (error) throw error;
      
      // Update local state - add to new list
      if (targetList === 'watched') {
        setWatched(prev => [...prev, item]);
      } else if (targetList === 'favorite') {
        setFavorites(prev => [...prev, item]);
      } else {
        setToWatch(prev => [...prev, item]);
      }
      
      toast({
        title: "Moved to list",
        description: `Item moved to your ${targetList.replace('_', ' ')} list`,
      });
    } catch (error) {
      console.error('Error moving item between lists:', error);
      toast({
        title: "Error",
        description: "Could not move item to the new list",
        variant: "destructive"
      });
    }
  };
  
  // Filtering and sorting logic
  const getFilteredAndSortedList = (list: MediaItemWithType[]): MediaItemWithType[] => {
    // First filter by search query
    let filteredList = list;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredList = list.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        const genres = item.genres?.map(g => g.name.toLowerCase()) || [];
        
        return title.includes(query) || genres.some(g => g.includes(query));
      });
    }
    
    // Then sort
    return [...filteredList].sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          const dateA = a.release_date || a.first_air_date || '';
          const dateB = b.release_date || b.first_air_date || '';
          return dateB.localeCompare(dateA);
          
        case 'oldest':
          const releaseDateA = a.release_date || a.first_air_date || '';
          const releaseDateB = b.release_date || b.first_air_date || '';
          return releaseDateA.localeCompare(releaseDateB);
          
        case 'rating-high':
          return (b.vote_average || 0) - (a.vote_average || 0);
          
        case 'rating-low':
          return (a.vote_average || 0) - (b.vote_average || 0);
          
        case 'title-asc':
          const titleA = (a.title || a.name || '').toLowerCase();
          const titleB = (b.title || b.name || '').toLowerCase();
          return titleA.localeCompare(titleB);
          
        case 'title-desc':
          const nameA = (a.title || a.name || '').toLowerCase();
          const nameB = (b.title || b.name || '').toLowerCase();
          return nameB.localeCompare(nameA);
          
        default:
          return 0;
      }
    });
  };
  
  // Memoized filtered and sorted lists
  const filteredToWatch = useMemo(() => getFilteredAndSortedList(toWatch), [toWatch, sortBy, searchQuery]);
  const filteredWatched = useMemo(() => getFilteredAndSortedList(watched), [watched, sortBy, searchQuery]);
  const filteredFavorites = useMemo(() => getFilteredAndSortedList(favorites), [favorites, sortBy, searchQuery]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Watchlist</h1>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search your lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="w-full sm:w-48">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Release</SelectItem>
              <SelectItem value="oldest">Oldest Release</SelectItem>
              <SelectItem value="rating-high">Highest Rating</SelectItem>
              <SelectItem value="rating-low">Lowest Rating</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="to-watch">
            To Watch ({filteredToWatch.length})
          </TabsTrigger>
          <TabsTrigger value="watched">
            Watched ({filteredWatched.length})
          </TabsTrigger>
          <TabsTrigger value="favorites">
            Favorites ({filteredFavorites.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="to-watch">
          {filteredToWatch.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchQuery ? 
                  "No results found. Try a different search term." : 
                  "You haven't added any movies or TV shows to your 'To Watch' list yet."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredToWatch.map((item) => (
                <div key={`${item.media_type}-${item.id}`} className="relative group">
                  <MovieCard
                    key={`${item.media_type}-${item.id}`}
                    title={item.title || item.name || ''}
                    posterPath={item.poster_path}
                    id={item.id}
                    type={item.media_type}
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => moveToList(item, 'watched')}
                      className="w-3/4"
                    >
                      Move to Watched
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => moveToList(item, 'favorite')}
                      className="w-3/4"
                    >
                      Move to Favorites
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleRemoveFromList(item.id, item.media_type, 'to_watch')}
                      className="w-3/4"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="watched">
          {filteredWatched.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchQuery ? 
                  "No results found. Try a different search term." : 
                  "You haven't marked any movies or TV shows as watched yet."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredWatched.map((item) => (
                <div key={`${item.media_type}-${item.id}`} className="relative group">
                  <MovieCard
                    key={`${item.media_type}-${item.id}`}
                    title={item.title || item.name || ''}
                    posterPath={item.poster_path}
                    id={item.id}
                    type={item.media_type}
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => moveToList(item, 'to_watch')}
                      className="w-3/4"
                    >
                      Move to To Watch
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => moveToList(item, 'favorite')}
                      className="w-3/4"
                    >
                      Move to Favorites
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleRemoveFromList(item.id, item.media_type, 'watched')}
                      className="w-3/4"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites">
          {filteredFavorites.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchQuery ? 
                  "No results found. Try a different search term." : 
                  "You haven't added any movies or TV shows to your favorites yet."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFavorites.map((item) => (
                <div key={`${item.media_type}-${item.id}`} className="relative group">
                  <MovieCard
                    key={`${item.media_type}-${item.id}`}
                    title={item.title || item.name || ''}
                    posterPath={item.poster_path}
                    id={item.id}
                    type={item.media_type}
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => moveToList(item, 'to_watch')}
                      className="w-3/4"
                    >
                      Move to To Watch
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => moveToList(item, 'watched')}
                      className="w-3/4"
                    >
                      Move to Watched
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleRemoveFromList(item.id, item.media_type, 'favorite')}
                      className="w-3/4"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Watchlist;

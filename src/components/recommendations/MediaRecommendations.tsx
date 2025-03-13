
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MovieCard from '@/components/movies/MovieCard';
import { Loader2 } from 'lucide-react';
import AddToListDialog from '@/components/movies/AddToListDialog';
import { useToast } from '@/components/ui/use-toast';
import { UserListItem } from '@/types/supabase';

interface Recommendation {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  vote_average: number;
}

const MediaRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [personalRecommendations, setPersonalRecommendations] = useState<Recommendation[]>([]);
  const [trendingRecommendations, setTrendingRecommendations] = useState<Recommendation[]>([]);
  const [genreRecommendations, setGenreRecommendations] = useState<Recommendation[]>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<number[]>([]);
  
  useEffect(() => {
    if (!user) {
      // If user is not logged in, just load trending
      fetchTrendingMedia();
      setIsLoading(false);
      return;
    }
    
    const fetchAllRecommendations = async () => {
      try {
        // Load user list items to analyze preferences
        const { data: userListData, error } = await supabase
          .from('user_lists')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const userItems = userListData as UserListItem[];
        
        // Extract watched and favorite items for recommendation analysis
        const watchedItems = userItems.filter(item => item.list_type === 'watched');
        const favoriteItems = userItems.filter(item => item.list_type === 'favorite');
        
        // Extract media IDs for processing
        const watchedMovieIds = watchedItems
          .filter(item => item.media_type === 'movie')
          .map(item => item.media_id);
          
        const watchedTvIds = watchedItems
          .filter(item => item.media_type === 'tv')
          .map(item => item.media_id);
          
        const favoriteMovieIds = favoriteItems
          .filter(item => item.media_type === 'movie')
          .map(item => item.media_id);
          
        const favoriteTvIds = favoriteItems
          .filter(item => item.media_type === 'tv')
          .map(item => item.media_id);
        
        // Get recommendations based on watch history
        await Promise.all([
          fetchPersonalRecommendations(watchedMovieIds, watchedTvIds, favoriteMovieIds, favoriteTvIds),
          fetchFavoriteGenres(watchedMovieIds, watchedTvIds, favoriteMovieIds, favoriteTvIds),
          fetchTrendingMedia()
        ]);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast({
          title: "Error loading recommendations",
          description: "Could not load personalized recommendations.",
          variant: "destructive"
        });
        
        // Fall back to trending if personal recommendations fail
        fetchTrendingMedia();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllRecommendations();
  }, [user, toast]);
  
  const fetchPersonalRecommendations = async (
    watchedMovieIds: number[],
    watchedTvIds: number[],
    favoriteMovieIds: number[],
    favoriteTvIds: number[]
  ) => {
    // Prioritize favorites for recommendations
    const movieIdsForRecs = favoriteMovieIds.length > 0 ? favoriteMovieIds : watchedMovieIds;
    const tvIdsForRecs = favoriteTvIds.length > 0 ? favoriteTvIds : watchedTvIds;
    
    const recommendations: Recommendation[] = [];
    
    // Get recommendations based on favorite or watched content
    if (movieIdsForRecs.length > 0) {
      // Take up to 3 recent items for recommendations to avoid too many API calls
      const recentMovieIds = movieIdsForRecs.slice(0, 3);
      
      for (const movieId of recentMovieIds) {
        try {
          const movieRecs = await api.getMovieDetails(movieId);
          if (movieRecs.similar?.results) {
            const formattedRecs = movieRecs.similar.results.map((movie: any) => ({
              ...movie,
              media_type: 'movie'
            }));
            recommendations.push(...formattedRecs);
          }
        } catch (error) {
          console.error(`Error fetching movie recommendations for ${movieId}:`, error);
        }
      }
    }
    
    if (tvIdsForRecs.length > 0) {
      // Take up to 3 recent items for recommendations
      const recentTvIds = tvIdsForRecs.slice(0, 3);
      
      for (const tvId of recentTvIds) {
        try {
          const tvRecs = await api.getTVShowDetails(tvId);
          if (tvRecs.similar?.results) {
            const formattedRecs = tvRecs.similar.results.map((show: any) => ({
              ...show,
              media_type: 'tv'
            }));
            recommendations.push(...formattedRecs);
          }
        } catch (error) {
          console.error(`Error fetching TV recommendations for ${tvId}:`, error);
        }
      }
    }
    
    // Filter out duplicates and items already in user's lists
    const allUserMediaIds = [...watchedMovieIds, ...watchedTvIds, ...favoriteMovieIds, ...favoriteTvIds];
    const filteredRecs = recommendations
      .filter(item => !allUserMediaIds.includes(item.id))
      // Remove duplicates
      .filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id && t.media_type === item.media_type)
      )
      // Sort by rating (highest first)
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      // Take top 10
      .slice(0, 10);
    
    setPersonalRecommendations(filteredRecs);
  };
  
  const fetchFavoriteGenres = async (
    watchedMovieIds: number[],
    watchedTvIds: number[],
    favoriteMovieIds: number[],
    favoriteTvIds: number[]
  ) => {
    const genreCounts: Record<number, number> = {};
    const processedItems: Set<number> = new Set();
    
    // Process movie genres
    for (const movieId of [...favoriteMovieIds, ...watchedMovieIds]) {
      if (processedItems.has(movieId)) continue;
      
      try {
        const movie = await api.getMovieDetails(movieId);
        if (movie.genres) {
          movie.genres.forEach((genre: { id: number }) => {
            genreCounts[genre.id] = (genreCounts[genre.id] || 0) + (favoriteMovieIds.includes(movieId) ? 2 : 1);
          });
        }
        processedItems.add(movieId);
      } catch (error) {
        console.error(`Error fetching movie genres for ${movieId}:`, error);
      }
    }
    
    // Process TV genres
    for (const tvId of [...favoriteTvIds, ...watchedTvIds]) {
      if (processedItems.has(tvId)) continue;
      
      try {
        const show = await api.getTVShowDetails(tvId);
        if (show.genres) {
          show.genres.forEach((genre: { id: number }) => {
            genreCounts[genre.id] = (genreCounts[genre.id] || 0) + (favoriteTvIds.includes(tvId) ? 2 : 1);
          });
        }
        processedItems.add(tvId);
      } catch (error) {
        console.error(`Error fetching TV genres for ${tvId}:`, error);
      }
    }
    
    // Determine top genres (up to 3)
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genreId]) => Number(genreId));
    
    setFavoriteGenres(topGenres);
    
    // Fetch recommendations based on top genres
    await fetchGenreBasedRecommendations(topGenres);
  };
  
  const fetchGenreBasedRecommendations = async (genreIds: number[]) => {
    if (genreIds.length === 0) return;
    
    try {
      // Get genre-based movie recommendations
      const movieResults = await api.discoverMovies({
        with_genres: genreIds.join(','),
        sort_by: 'popularity.desc',
        page: 1
      });
      
      // Get genre-based TV recommendations
      const tvResults = await api.discoverTVShows({
        with_genres: genreIds.join(','),
        sort_by: 'popularity.desc',
        page: 1
      });
      
      // Format results
      const movieRecs = movieResults.results.map((movie: any) => ({
        ...movie,
        media_type: 'movie'
      }));
      
      const tvRecs = tvResults.results.map((show: any) => ({
        ...show,
        media_type: 'tv'
      }));
      
      // Combine and sort by popularity
      const combinedResults = [...movieRecs, ...tvRecs]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 10);
      
      setGenreRecommendations(combinedResults);
    } catch (error) {
      console.error('Error fetching genre-based recommendations:', error);
    }
  };
  
  const fetchTrendingMedia = async () => {
    try {
      const trending = await api.getTrending('all', 'week');
      setTrendingRecommendations(trending.results.slice(0, 10));
    } catch (error) {
      console.error('Error fetching trending media:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Recommendations For You</CardTitle>
        <CardDescription>
          {user ? 'Based on your watch history and preferences' : 'Trending content you might enjoy'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" disabled={!user || personalRecommendations.length === 0}>
              Personal Picks
            </TabsTrigger>
            <TabsTrigger value="genres" disabled={!user || genreRecommendations.length === 0}>
              Based on Genres
            </TabsTrigger>
            <TabsTrigger value="trending">
              Trending
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            {personalRecommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {personalRecommendations.map((item) => (
                  <div key={`${item.media_type}-${item.id}`} className="relative group">
                    <MovieCard
                      title={item.title || item.name || ''}
                      posterPath={item.poster_path}
                      id={item.id}
                      type={item.media_type}
                    />
                    {user && (
                      <div className="absolute bottom-2 right-2">
                        <AddToListDialog
                          mediaId={item.id}
                          mediaType={item.media_type}
                          title={item.title || item.name || ''}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Keep watching and rating content to get personalized recommendations.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="genres">
            {genreRecommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {genreRecommendations.map((item) => (
                  <div key={`${item.media_type}-${item.id}`} className="relative group">
                    <MovieCard
                      title={item.title || item.name || ''}
                      posterPath={item.poster_path}
                      id={item.id}
                      type={item.media_type}
                    />
                    {user && (
                      <div className="absolute bottom-2 right-2">
                        <AddToListDialog
                          mediaId={item.id}
                          mediaType={item.media_type}
                          title={item.title || item.name || ''}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  We need more information about your genre preferences.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trending">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trendingRecommendations.map((item) => (
                <div key={`${item.media_type}-${item.id}`} className="relative group">
                  <MovieCard
                    title={item.title || item.name || ''}
                    posterPath={item.poster_path}
                    id={item.id}
                    type={item.media_type}
                  />
                  {user && (
                    <div className="absolute bottom-2 right-2">
                      <AddToListDialog
                        mediaId={item.id}
                        mediaType={item.media_type}
                        title={item.title || item.name || ''}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MediaRecommendations;

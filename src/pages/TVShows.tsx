
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { TVShow } from '@/types/tmdb';
import MovieCard from '@/components/movies/MovieCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const TVShows = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [popularShows, setPopularShows] = useState<TVShow[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<TVShow[]>([]);
  const [onAirShows, setOnAirShows] = useState<TVShow[]>([]);
  
  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        const [popular, topRated, onAir] = await Promise.all([
          api.getPopularTVShows(),
          api.getTopRatedTVShows(),
          api.getOnTheAirTVShows()
        ]);
        
        setPopularShows(popular.results);
        setTopRatedShows(topRated.results);
        setOnAirShows(onAir.results);
      } catch (error) {
        console.error('Error fetching TV shows:', error);
        toast({
          title: "Error loading TV shows",
          description: "Could not load TV shows. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTVShows();
  }, [toast]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p>Loading TV shows...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">TV Shows</h1>
      
      <Tabs defaultValue="popular" className="space-y-6">
        <TabsList>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
          <TabsTrigger value="on-air">On Air</TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popularShows.map((show) => (
              <MovieCard
                key={show.id}
                item={show}
                type="tv"
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="top-rated">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topRatedShows.map((show) => (
              <MovieCard
                key={show.id}
                item={show}
                type="tv"
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="on-air">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {onAirShows.map((show) => (
              <MovieCard
                key={show.id}
                item={show}
                type="tv"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TVShows;

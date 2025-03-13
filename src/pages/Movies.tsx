
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Movie } from '@/types/tmdb';
import MovieCard from '@/components/movies/MovieCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const Movies = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [popular, topRated, upcoming] = await Promise.all([
          api.getPopularMovies(),
          api.getTopRatedMovies(),
          api.getUpcomingMovies()
        ]);
        
        setPopularMovies(popular.results);
        setTopRatedMovies(topRated.results);
        setUpcomingMovies(upcoming.results);
      } catch (error) {
        console.error('Error fetching movies:', error);
        toast({
          title: "Error loading movies",
          description: "Could not load movies. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMovies();
  }, [toast]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p>Loading movies...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Movies</h1>
      
      <Tabs defaultValue="popular" className="space-y-6">
        <TabsList>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popularMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                item={movie}
                type="movie"
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="top-rated">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topRatedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                item={movie}
                type="movie"
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {upcomingMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                item={movie}
                type="movie"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Movies;

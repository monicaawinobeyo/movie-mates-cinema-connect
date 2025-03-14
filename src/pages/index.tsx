
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import HeroSection from '@/components/home/HeroSection';
import MovieRow from '@/components/movies/MovieRow';
import MediaRecommendations from '@/components/recommendations/MediaRecommendations';
import { useToast } from '@/components/ui/use-toast';
import { Movie, TVShow } from '@/types/tmdb';

const Index = () => {
  const { toast } = useToast();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  
  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        const data = await api.getTrending('movie', 'week');
        setTrendingMovies(data.results);
      } catch (error) {
        console.error('Error fetching trending movies:', error);
      }
    };
    
    fetchTrendingMovies();
    
    const checkForDarkModePreference = () => {
      const storedTheme = localStorage.getItem('theme');
      if (!storedTheme) {
        // Check system preference if no stored preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        }
      }
    };
    
    checkForDarkModePreference();
  }, []);
  
  return (
    <div className="space-y-8">
      <HeroSection items={trendingMovies} />
      
      <div className="container px-4 mx-auto space-y-8">
        <MediaRecommendations />
        
        <MovieRow
          title="Trending Movies"
          fetchMedia={() => api.getTrending('movie', 'week')}
          mediaType="movie"
        />
        
        <MovieRow
          title="Trending TV Shows"
          fetchMedia={() => api.getTrending('tv', 'week')}
          mediaType="tv"
        />
        
        <MovieRow
          title="Top Rated Movies"
          fetchMedia={() => api.getTopRatedMovies()}
          mediaType="movie"
        />
        
        <MovieRow
          title="Top Rated TV Shows"
          fetchMedia={() => api.getTopRatedTVShows()}
          mediaType="tv"
        />
      </div>
    </div>
  );
};

export default Index;

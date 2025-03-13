
import { useEffect } from 'react';
import { api } from '@/services/api';
import HeroSection from '@/components/home/HeroSection';
import MovieRow from '@/components/movies/MovieRow';
import MediaRecommendations from '@/components/recommendations/MediaRecommendations';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();
  
  useEffect(() => {
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
      <HeroSection />
      
      <div className="container px-4 mx-auto space-y-8">
        <MediaRecommendations />
        
        <MovieRow
          title="Trending Movies"
          endpoint={() => api.getTrending('movie', 'week')}
          mediaType="movie"
        />
        
        <MovieRow
          title="Trending TV Shows"
          endpoint={() => api.getTrending('tv', 'week')}
          mediaType="tv"
        />
        
        <MovieRow
          title="Top Rated Movies"
          endpoint={() => api.getTopRatedMovies()}
          mediaType="movie"
        />
        
        <MovieRow
          title="Top Rated TV Shows"
          endpoint={() => api.getTopRatedTVShows()}
          mediaType="tv"
        />
      </div>
    </div>
  );
};

export default Index;

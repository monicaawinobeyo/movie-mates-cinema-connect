
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import HeroSection from '@/components/home/HeroSection';
import MovieRow from '@/components/movies/MovieRow';
import { Movie, TVShow } from '@/types/tmdb';

const Index = () => {
  const [featuredContent, setFeaturedContent] = useState<(Movie | TVShow)[]>([]);
  
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.getTrending('all', 'week'),
  });
  
  const { data: popularMoviesData, isLoading: popularMoviesLoading } = useQuery({
    queryKey: ['popularMovies'],
    queryFn: () => api.getPopularMovies(),
  });
  
  const { data: topRatedMoviesData, isLoading: topRatedMoviesLoading } = useQuery({
    queryKey: ['topRatedMovies'],
    queryFn: () => api.getTopRatedMovies(),
  });
  
  const { data: popularTVData, isLoading: popularTVLoading } = useQuery({
    queryKey: ['popularTV'],
    queryFn: () => api.getPopularTVShows(),
  });
  
  const { data: topRatedTVData, isLoading: topRatedTVLoading } = useQuery({
    queryKey: ['topRatedTV'],
    queryFn: () => api.getTopRatedTVShows(),
  });
  
  useEffect(() => {
    if (trendingData?.results) {
      setFeaturedContent(trendingData.results.slice(0, 10));
    }
  }, [trendingData]);
  
  const isLoading = 
    trendingLoading || 
    popularMoviesLoading || 
    topRatedMoviesLoading || 
    popularTVLoading || 
    topRatedTVLoading;

  if (isLoading && !featuredContent.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading awesome content...</h2>
          <p className="text-muted-foreground">Getting the latest movies and shows for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <HeroSection items={featuredContent} />
      
      <div className="mt-8">
        {trendingData?.results && (
          <MovieRow 
            title="Trending Now" 
            items={trendingData.results}
            type="movie" // This is a simplification since trending includes both movies and TV
          />
        )}
        
        {popularMoviesData?.results && (
          <MovieRow 
            title="Popular Movies" 
            items={popularMoviesData.results}
            type="movie"
          />
        )}
        
        {topRatedMoviesData?.results && (
          <MovieRow 
            title="Top Rated Movies" 
            items={topRatedMoviesData.results}
            type="movie"
          />
        )}
        
        {popularTVData?.results && (
          <MovieRow 
            title="Popular TV Shows" 
            items={popularTVData.results}
            type="tv"
          />
        )}
        
        {topRatedTVData?.results && (
          <MovieRow 
            title="Top Rated TV Shows" 
            items={topRatedTVData.results}
            type="tv"
          />
        )}
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie, TVShow } from '@/types/tmdb';
import MovieCard from './MovieCard';
import { Button } from '@/components/ui/button';

export interface MovieRowProps {
  title: string;
  fetchMedia?: () => Promise<any>;
  mediaType?: 'movie' | 'tv';
  items?: (Movie | TVShow)[];
  type?: 'movie' | 'tv';
}

const MovieRow = ({ title, fetchMedia, mediaType, items, type }: MovieRowProps) => {
  const [media, setMedia] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  
  const effectiveMediaType = mediaType || type || 'movie';
  
  useEffect(() => {
    if (items) {
      setMedia(items);
      setLoading(false);
      return;
    }
    
    const loadMedia = async () => {
      if (!fetchMedia) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await fetchMedia();
        setMedia(data.results || []);
        setError(null);
      } catch (err) {
        console.error(`Error fetching ${title}:`, err);
        setError(`Failed to load ${title}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadMedia();
  }, [fetchMedia, title, items]);
  
  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.8 
        : scrollLeft + clientWidth * 0.8;
      
      rowRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-4 overflow-x-hidden pb-4">
          {[...Array(6)].map((_, index) => (
            <div 
              key={index}
              className="min-w-[180px] h-[270px] rounded-md bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="bg-muted p-4 rounded-md text-muted-foreground">
          {error}
        </div>
      </div>
    );
  }
  
  if (media.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4 relative group">
      <h2 className="text-2xl font-bold">{title}</h2>
      
      <div className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
        >
          {media.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-[180px] snap-start">
              <MovieCard
                id={item.id}
                title={'title' in item ? item.title : item.name}
                posterPath={item.poster_path}
                type={effectiveMediaType}
              />
            </div>
          ))}
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default MovieRow;

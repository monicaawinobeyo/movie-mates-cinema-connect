
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MovieCard from './MovieCard';
import { Movie, TVShow } from '@/types/tmdb';

interface MovieRowProps {
  title: string;
  items: (Movie | TVShow)[];
  type: 'movie' | 'tv';
}

const MovieRow = ({ title, items, type }: MovieRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { current } = rowRef;
      const scrollAmount = current.clientWidth * 0.75;
      
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-8">{title}</h2>
      
      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 left-2 z-10 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
          onClick={() => scroll('left')}
        >
          <ChevronLeft size={24} />
        </Button>
        
        <div 
          ref={rowRef}
          className="flex overflow-x-auto py-2 px-4 md:px-8 space-x-4 scrollbar-none"
        >
          {items.map((item) => (
            <MovieCard 
              key={item.id} 
              item={item} 
              type={type}
              className="min-w-[160px] md:min-w-[180px] lg:min-w-[200px]"
            />
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-2 z-10 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
          onClick={() => scroll('right')}
        >
          <ChevronRight size={24} />
        </Button>
      </div>
    </div>
  );
};

export default MovieRow;

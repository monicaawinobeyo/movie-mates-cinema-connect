
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, ThumbsUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Movie, TVShow } from '@/types/tmdb';
import { getPosterUrl } from '@/services/api';

interface MovieCardProps {
  item: Movie | TVShow;
  type: 'movie' | 'tv';
  className?: string;
}

const MovieCard = ({ item, type, className = '' }: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  
  const title = 'title' in item ? item.title : item.name;
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const rating = Math.round(item.vote_average * 10);
  
  const handleAddToList = () => {
    toast({
      title: "Added to My List",
      description: `${title} has been added to your list`,
    });
  };
  
  return (
    <div 
      className={`relative rounded-md overflow-hidden transition-transform duration-300 ${className} ${isHovered ? 'scale-105 z-10 shadow-xl' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[2/3] bg-muted">
        <img 
          src={getPosterUrl(item.poster_path)}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      {isHovered && (
        <div className="absolute inset-0 flex flex-col justify-end p-3 movie-card-overlay animate-fade-in">
          <h3 className="font-bold truncate">{title}</h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 mb-2">
            <span>{year}</span>
            <span className={`${rating >= 70 ? 'text-green-500' : rating >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {rating}%
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="default" className="flex-1 bg-primary hover:bg-primary/90" asChild>
              <Link to={`/${type}/${item.id}`}>
                <Play size={16} className="mr-1" /> Play
              </Link>
            </Button>
            
            <Button size="sm" variant="outline" onClick={handleAddToList}>
              <Plus size={16} />
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => toast({ title: "Liked", description: `You liked ${title}` })}>
              <ThumbsUp size={16} />
            </Button>
            
            <Button size="sm" variant="outline" asChild>
              <Link to={`/${type}/${item.id}`}>
                <Info size={16} />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieCard;

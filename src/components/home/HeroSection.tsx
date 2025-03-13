
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie, TVShow } from '@/types/tmdb';
import { getBackdropUrl } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface HeroSectionProps {
  items: (Movie | TVShow)[];
}

const HeroSection = ({ items }: HeroSectionProps) => {
  const [featured, setFeatured] = useState<Movie | TVShow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (items && items.length > 0) {
      // Pick a random item with a good backdrop
      const filtered = items.filter(item => item.backdrop_path);
      const randomIndex = Math.floor(Math.random() * filtered.length);
      setFeatured(filtered[randomIndex] || items[0]);
    }
  }, [items]);
  
  if (!featured) return null;

  const title = 'title' in featured ? featured.title : featured.name;
  const type = 'title' in featured ? 'movie' : 'tv';
  const backdropUrl = getBackdropUrl(featured.backdrop_path, 'original');
  const overview = featured.overview.length > 200 
    ? `${featured.overview.substring(0, 200)}...` 
    : featured.overview;
  
  const handleAddToList = () => {
    toast({
      title: "Added to My List",
      description: `${title} has been added to your list`,
    });
  };

  return (
    <div className="relative w-full h-[70vh] min-h-[500px]">
      <div className={`absolute inset-0 ${loaded ? 'animate-fade-in' : 'opacity-0'}`}>
        <img 
          src={backdropUrl}
          alt={title}
          className="w-full h-full object-cover"
          onLoad={() => setLoaded(true)}
        />
        <div className="absolute inset-0 hero-gradient" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-16 z-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-up">
            {title}
          </h1>
          
          <p className="text-md md:text-lg text-muted-foreground mb-6 animate-fade-up">
            {overview}
          </p>
          
          <div className="flex flex-wrap gap-4 animate-fade-up">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to={`/${type}/${featured.id}`}>
                <Play size={20} className="mr-2" /> Play
              </Link>
            </Button>
            
            <Button size="lg" variant="outline" onClick={handleAddToList}>
              <Plus size={20} className="mr-2" /> My List
            </Button>
            
            <Button size="lg" variant="secondary" asChild>
              <Link to={`/${type}/${featured.id}`}>
                <Info size={20} className="mr-2" /> More Info
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

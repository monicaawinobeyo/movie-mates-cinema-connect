
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Plus, Star, Calendar, Hash, Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, getBackdropUrl, getPosterUrl } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import MovieRow from '@/components/movies/MovieRow';

const TVDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [trailerOpen, setTrailerOpen] = useState(false);
  
  const { data: show, isLoading } = useQuery({
    queryKey: ['tv', id],
    queryFn: () => api.getTVShowDetails(Number(id)),
    enabled: !!id,
  });
  
  if (isLoading || !show) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading TV show details...</h2>
        </div>
      </div>
    );
  }
  
  const backdropUrl = getBackdropUrl(show.backdrop_path, 'original');
  const posterUrl = getPosterUrl(show.poster_path, 'large');
  
  // Find trailer if available
  const trailer = show.videos?.results.find(
    video => video.type === 'Trailer' && video.site === 'YouTube'
  ) || show.videos?.results[0];
  
  const handleAddToList = () => {
    toast({
      title: "Added to My List",
      description: `${show.name} has been added to your list`,
    });
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };
  
  return (
    <div className="pb-16">
      {/* Hero section with backdrop */}
      <div className="relative w-full h-[70vh] min-h-[500px]">
        <img 
          src={backdropUrl}
          alt={show.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient" />
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-24 left-4 md:left-8 z-10 bg-background/30 hover:bg-background/50"
          asChild
        >
          <Link to="/">
            <ArrowLeft size={24} />
          </Link>
        </Button>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-16 z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-8">
            <div className="hidden md:block w-64 h-96 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={posterUrl}
                alt={show.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-2">
                {show.name}
              </h1>
              
              {show.tagline && (
                <p className="text-xl text-muted-foreground mb-4 italic">
                  "{show.tagline}"
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4 text-sm">
                {show.genres?.map(genre => (
                  <span 
                    key={genre.id}
                    className="px-3 py-1 bg-secondary rounded-full"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4 mb-6 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center">
                  <Star size={16} className="mr-1 text-yellow-500" />
                  <span>{show.vote_average.toFixed(1)}/10</span>
                </div>
                
                <div className="flex items-center">
                  <Hash size={16} className="mr-1" />
                  <span>{show.number_of_seasons} Season{show.number_of_seasons !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  <span>{formatDate(show.first_air_date)}</span>
                </div>
              </div>
              
              <p className="text-md md:text-lg mb-6">
                {show.overview}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setTrailerOpen(true)}
                  disabled={!trailer}
                >
                  <Play size={20} className="mr-2" /> 
                  {trailer ? 'Watch Trailer' : 'No Trailer Available'}
                </Button>
                
                <Button size="lg" variant="outline" onClick={handleAddToList}>
                  <Plus size={20} className="mr-2" /> My List
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => toast({
                    title: "Share",
                    description: "Sharing functionality coming soon!"
                  })}
                >
                  <Share2 size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cast section */}
      {show.credits?.cast && show.credits.cast.length > 0 && (
        <div className="mt-12 px-4 md:px-8 lg:px-16">
          <h2 className="text-2xl font-bold mb-6">Cast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {show.credits.cast.slice(0, 6).map(person => (
              <div key={person.id} className="text-center">
                <div className="w-full aspect-square rounded-md overflow-hidden bg-muted mb-2">
                  <img 
                    src={getPosterUrl(person.profile_path)}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-muted-foreground">{person.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Seasons section */}
      {show.seasons && show.seasons.length > 0 && (
        <div className="mt-12 px-4 md:px-8 lg:px-16">
          <h2 className="text-2xl font-bold mb-6">Seasons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {show.seasons.filter(season => season.season_number > 0).map(season => (
              <div key={season.id} className="bg-card rounded-md overflow-hidden">
                <div className="aspect-[2/3] bg-muted">
                  <img 
                    src={getPosterUrl(season.poster_path)}
                    alt={season.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1">{season.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {season.episode_count} Episode{season.episode_count !== 1 ? 's' : ''} • {season.air_date ? new Date(season.air_date).getFullYear() : 'TBA'}
                  </p>
                  <p className="text-sm line-clamp-2">
                    {season.overview || `Season ${season.season_number} of ${show.name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Similar shows */}
      {show.similar?.results && show.similar.results.length > 0 && (
        <div className="mt-12">
          <MovieRow 
            title="More Like This" 
            items={show.similar.results}
            type="tv"
          />
        </div>
      )}
      
      {/* Trailer modal */}
      {trailerOpen && trailer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title={trailer.name}
              className="w-full h-full"
              allowFullScreen
            ></iframe>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-background/50"
              onClick={() => setTrailerOpen(false)}
            >
              <div className="text-2xl">&times;</div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TVDetails;

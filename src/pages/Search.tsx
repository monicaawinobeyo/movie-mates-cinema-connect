
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Movie, TVShow, Person } from '@/types/tmdb';
import MovieCard from '@/components/movies/MovieCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';

type SearchResults = {
  movies: Movie[];
  tvShows: TVShow[];
  people: Person[];
  multi: (Movie | TVShow | Person)[];
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    movies: [],
    tvShows: [],
    people: [],
    multi: [],
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ query: searchQuery.trim() });
    }
  };
  
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) return;
      
      setIsLoading(true);
      
      try {
        const [multiData, moviesData, tvShowsData, peopleData] = await Promise.all([
          api.searchMulti(query),
          api.searchMovies(query),
          api.searchTVShows(query),
          api.searchPeople(query)
        ]);
        
        setResults({
          multi: multiData.results,
          movies: moviesData.results,
          tvShows: tvShowsData.results,
          people: peopleData.results
        });
      } catch (error) {
        console.error('Error searching:', error);
        toast({
          title: "Search error",
          description: "Could not perform search. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [query, toast]);
  
  const getMediaType = (item: Movie | TVShow | Person): 'movie' | 'tv' | 'person' => {
    if ('media_type' in item && item.media_type) {
      return item.media_type as 'movie' | 'tv' | 'person';
    }
    if ('first_air_date' in item) return 'tv';
    if ('release_date' in item) return 'movie';
    return 'person';
  };
  
  const renderSearchResults = (items: (Movie | TVShow | Person)[], fallbackMessage: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <p>{fallbackMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => {
          // Skip person entries in multi-search
          const mediaType = getMediaType(item);
          if (mediaType === 'person') return null;
          
          return (
            <MovieCard
              key={`${mediaType}-${item.id}`}
              item={item as Movie | TVShow}
              type={mediaType as 'movie' | 'tv'}
            />
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for movies, TV shows, people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            <SearchIcon className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>
      
      {query ? (
        <>
          <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Searching...</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="movies">Movies</TabsTrigger>
                <TabsTrigger value="tv-shows">TV Shows</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {renderSearchResults(results.multi, "No results found. Try a different search term.")}
              </TabsContent>
              
              <TabsContent value="movies">
                {renderSearchResults(results.movies, "No movies found. Try a different search term.")}
              </TabsContent>
              
              <TabsContent value="tv-shows">
                {renderSearchResults(results.tvShows, "No TV shows found. Try a different search term.")}
              </TabsContent>
            </Tabs>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Search for Movies and TV Shows</h2>
          <p className="text-muted-foreground">
            Enter a search term to find movies, TV shows, and more.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;

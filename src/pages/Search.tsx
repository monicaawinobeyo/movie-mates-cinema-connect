
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaSearch } from '@/hooks/useMediaSearch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import MovieCard from '@/components/movies/MovieCard';
import { Loader2, Search as SearchIcon, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { Movie, TVShow, Person } from '@/types/tmdb';
import MediaRecommendations from '@/components/recommendations/MediaRecommendations';

const Search = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const { query, setQuery, results, clearCache } = useMediaSearch(initialQuery);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([1900, new Date().getFullYear()]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [adultsOnly, setAdultsOnly] = useState<boolean>(false);
  const [isFilteredLoading, setIsFilteredLoading] = useState(false);
  const [filteredResults, setFilteredResults] = useState<{
    movies: Movie[];
    tvShows: TVShow[];
  }>({
    movies: [],
    tvShows: []
  });
  
  // Load genres for filtering
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const [movieGenres, tvGenres] = await Promise.all([
          api.getMovieGenres(),
          api.getTVGenres()
        ]);
        
        // Combine and de-duplicate genres
        const combinedGenres = [...movieGenres.genres, ...tvGenres.genres];
        const uniqueGenres = Array.from(
          new Map(combinedGenres.map(item => [item.id, item])).values()
        );
        
        setGenres(uniqueGenres);
      } catch (error) {
        console.error('Error loading genres:', error);
      }
    };
    
    loadGenres();
  }, []);
  
  // Apply advanced filters
  const applyFilters = async () => {
    setIsFilteredLoading(true);
    
    try {
      // Common filter parameters
      const baseParams = {
        sort_by: sortBy,
        'vote_average.gte': ratingRange[0],
        'vote_average.lte': ratingRange[1],
        include_adult: adultsOnly,
        with_genres: selectedGenres.length > 0 ? selectedGenres.join(',') : undefined
      };
      
      // Specific params for movies and TV shows
      const movieParams = {
        ...baseParams,
        'primary_release_date.gte': `${yearRange[0]}-01-01`,
        'primary_release_date.lte': `${yearRange[1]}-12-31`,
      };
      
      const tvParams = {
        ...baseParams,
        'first_air_date.gte': `${yearRange[0]}-01-01`,
        'first_air_date.lte': `${yearRange[1]}-12-31`,
      };
      
      // Query params for keyword search
      const keywordParams = query.trim() ? { query: query.trim() } : {};
      
      // Fetch filtered results
      let movieResults: Movie[] = [];
      let tvResults: TVShow[] = [];
      
      if (query.trim()) {
        // If we have a search term, use search endpoints with additional filters via discover
        const [searchMoviesData, searchTVShowsData] = await Promise.all([
          api.searchMovies(query, 1),
          api.searchTVShows(query, 1)
        ]);
        
        // Get IDs of search results to filter with discover
        const movieIds = searchMoviesData.results.map((movie: Movie) => movie.id);
        const tvIds = searchTVShowsData.results.map((show: TVShow) => show.id);
        
        if (movieIds.length > 0) {
          const filteredMoviesData = await api.discoverMovies({
            ...movieParams,
            with_keywords: undefined, // Can't combine with direct IDs
            include_adult: adultsOnly,
          });
          
          // Manual filtering by ID intersection
          movieResults = filteredMoviesData.results.filter((movie: Movie) => 
            movieIds.includes(movie.id)
          );
        }
        
        if (tvIds.length > 0) {
          const filteredTVShowsData = await api.discoverTVShows({
            ...tvParams,
            with_keywords: undefined,
            include_adult: adultsOnly,
          });
          
          // Manual filtering by ID intersection
          tvResults = filteredTVShowsData.results.filter((show: TVShow) => 
            tvIds.includes(show.id)
          );
        }
        
      } else {
        // If no search term, use discover endpoints directly
        const [discoverMoviesData, discoverTVShowsData] = await Promise.all([
          api.discoverMovies(movieParams),
          api.discoverTVShows(tvParams)
        ]);
        
        movieResults = discoverMoviesData.results;
        tvResults = discoverTVShowsData.results;
      }
      
      setFilteredResults({
        movies: movieResults,
        tvShows: tvResults
      });
      
      // Switch tab based on results
      if (activeTab === 'all') {
        if (movieResults.length > 0 && tvResults.length === 0) {
          setActiveTab('movies');
        } else if (movieResults.length === 0 && tvResults.length > 0) {
          setActiveTab('tvShows');
        }
      }
      
      // Show toast if no results
      if (movieResults.length === 0 && tvResults.length === 0) {
        toast({
          title: "No results found",
          description: "Try adjusting your filters for more results.",
        });
      }
      
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: "Error filtering results",
        description: "Could not apply filters. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFilteredLoading(false);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedGenres([]);
    setYearRange([1900, new Date().getFullYear()]);
    setRatingRange([0, 10]);
    setSortBy('popularity.desc');
    setAdultsOnly(false);
    clearCache();
    
    // Clear filtered results and reset to basic search
    setFilteredResults({
      movies: [],
      tvShows: []
    });
  };
  
  // Toggle genre selection
  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };
  
  // Get display results based on active tab
  const getDisplayResults = () => {
    // Use filtered results if available, otherwise use search results
    const displayMovies = filteredResults.movies.length > 0 
      ? filteredResults.movies 
      : results.movies;
      
    const displayTVShows = filteredResults.tvShows.length > 0 
      ? filteredResults.tvShows 
      : results.tvShows;
      
    switch (activeTab) {
      case 'movies':
        return displayMovies;
      case 'tvShows':
        return displayTVShows;
      case 'people':
        return results.people;
      case 'all':
      default:
        return [
          ...displayMovies.map(item => ({ ...item, media_type: 'movie' as const })),
          ...displayTVShows.map(item => ({ ...item, media_type: 'tv' as const })),
          ...results.people.map(item => ({ ...item, media_type: 'person' as const }))
        ];
    }
  };
  
  // Sort options based on media type
  const getSortOptions = () => {
    const commonOptions = [
      { value: 'popularity.desc', label: 'Popularity (High to Low)' },
      { value: 'popularity.asc', label: 'Popularity (Low to High)' },
      { value: 'vote_average.desc', label: 'Rating (High to Low)' },
      { value: 'vote_average.asc', label: 'Rating (Low to High)' },
    ];
    
    if (activeTab === 'movies' || activeTab === 'all') {
      return [
        ...commonOptions,
        { value: 'primary_release_date.desc', label: 'Release Date (Newest)' },
        { value: 'primary_release_date.asc', label: 'Release Date (Oldest)' },
        { value: 'title.asc', label: 'Title (A-Z)' },
        { value: 'title.desc', label: 'Title (Z-A)' },
      ];
    } else {
      return [
        ...commonOptions,
        { value: 'first_air_date.desc', label: 'First Air Date (Newest)' },
        { value: 'first_air_date.asc', label: 'First Air Date (Oldest)' },
        { value: 'name.asc', label: 'Name (A-Z)' },
        { value: 'name.desc', label: 'Name (Z-A)' },
      ];
    }
  };
  
  const displayResults = getDisplayResults();
  const isLoading = results.isLoading || isFilteredLoading;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for movies, TV shows, or people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 py-6 text-lg"
          />
          {query && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setQuery('')}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movies">Movies</TabsTrigger>
              <TabsTrigger value="tvShows">TV Shows</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-4 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label className="mb-2 block">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSortOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">Rating Range</Label>
                <div className="px-2">
                  <Slider
                    value={ratingRange}
                    min={0}
                    max={10}
                    step={0.5}
                    onValueChange={(value) => setRatingRange(value as [number, number])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm">
                    <span>{ratingRange[0]}</span>
                    <span>{ratingRange[1]}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Year Range</Label>
                <div className="px-2">
                  <Slider
                    value={yearRange}
                    min={1900}
                    max={new Date().getFullYear()}
                    step={1}
                    onValueChange={(value) => setYearRange(value as [number, number])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm">
                    <span>{yearRange[0]}</span>
                    <span>{yearRange[1]}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Content Rating</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="adults-only" 
                    checked={adultsOnly}
                    onCheckedChange={(checked) => setAdultsOnly(checked as boolean)} 
                  />
                  <label
                    htmlFor="adults-only"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Include adult content
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block">Genres</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {genres.map(genre => (
                  <Button
                    key={genre.id}
                    variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleGenre(genre.id)}
                    className="text-xs"
                  >
                    {genre.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </Card>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : displayResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayResults.map((item) => {
              if (item.media_type === 'person') {
                // Person card
                return (
                  <Card key={`person-${item.id}`} className="overflow-hidden">
                    <div className="aspect-[2/3] relative">
                      <img
                        src={item.profile_path ? `https://image.tmdb.org/t/p/w185${item.profile_path}` : '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 text-center">
                      <p className="font-medium truncate">{item.name}</p>
                    </div>
                  </Card>
                );
              } else {
                // Movie or TV show card
                return (
                  <MovieCard
                    key={`${item.media_type}-${item.id}`}
                    title={item.title || item.name || ''}
                    posterPath={item.poster_path}
                    id={item.id}
                    type={item.media_type as 'movie' | 'tv'}
                  />
                );
              }
            })}
          </div>
        ) : (
          query ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No results found for "{query}"</p>
              <p className="text-muted-foreground mt-2">Try searching for a different term.</p>
            </div>
          ) : (
            <MediaRecommendations />
          )
        )}
      </div>
    </div>
  );
};

export default Search;

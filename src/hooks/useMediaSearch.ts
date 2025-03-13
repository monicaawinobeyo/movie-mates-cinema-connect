
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/services/api';
import { Movie, TVShow, Person } from '@/types/tmdb';

interface SearchResult {
  movies: Movie[];
  tvShows: TVShow[];
  people: Person[];
  isLoading: boolean;
  error: string | null;
}

interface CachedResult {
  timestamp: number;
  data: {
    movies: Movie[];
    tvShows: TVShow[];
    people: Person[];
  };
}

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

export const useMediaSearch = (initialQuery: string = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult>({
    movies: [],
    tvShows: [],
    people: [],
    isLoading: false,
    error: null
  });
  
  // In-memory cache for search results
  const searchCache = useRef<Record<string, CachedResult>>({});
  
  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({
        movies: [],
        tvShows: [],
        people: [],
        isLoading: false,
        error: null
      });
      return;
    }
    
    // Check cache first
    const cachedResult = searchCache.current[searchQuery];
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      setResults({
        ...cachedResult.data,
        isLoading: false,
        error: null
      });
      return;
    }
    
    setResults(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Fetch results in parallel
      const [moviesData, tvShowsData, peopleData] = await Promise.all([
        api.searchMovies(searchQuery),
        api.searchTVShows(searchQuery),
        api.searchPeople(searchQuery)
      ]);
      
      const newResults = {
        movies: moviesData.results,
        tvShows: tvShowsData.results,
        people: peopleData.results,
        isLoading: false,
        error: null
      };
      
      // Update state
      setResults(newResults);
      
      // Cache results
      searchCache.current[searchQuery] = {
        timestamp: Date.now(),
        data: {
          movies: moviesData.results,
          tvShows: tvShowsData.results,
          people: peopleData.results,
        }
      };
      
    } catch (error) {
      console.error('Search error:', error);
      setResults(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to search. Please try again.'
      }));
    }
  }, []);
  
  const debouncedSearch = useCallback((searchQuery: string) => {
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Only search if query is not empty
    if (searchQuery.trim()) {
      // Set loading state immediately for better UX
      setResults(prev => ({ ...prev, isLoading: true }));
      
      // Debounce actual search
      debounceTimer.current = setTimeout(() => {
        search(searchQuery);
      }, 300);
    } else {
      // If empty query, clear results
      setResults({
        movies: [],
        tvShows: [],
        people: [],
        isLoading: false,
        error: null
      });
    }
  }, [search]);
  
  useEffect(() => {
    debouncedSearch(query);
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, debouncedSearch]);
  
  // Expose function to clear cache
  const clearCache = useCallback(() => {
    searchCache.current = {};
  }, []);
  
  return {
    query,
    setQuery,
    results,
    clearCache
  };
};


// TMDb API URL and key
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const API_KEY = '22766f958212a9c2cf269d2e6b06a577';

// Image URLs
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
export const POSTER_SIZES = {
  tiny: 'w92',
  small: 'w154',
  medium: 'w185',
  large: 'w342',
  xlarge: 'w500',
  xxlarge: 'w780',
  original: 'original',
};

export const BACKDROP_SIZES = {
  small: 'w300',
  medium: 'w780',
  large: 'w1280',
  original: 'original',
};

// Formatter for poster URLs
export const getPosterUrl = (path: string | null, size = POSTER_SIZES.large) => {
  if (!path) return '/placeholder.svg';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Formatter for backdrop URLs
export const getBackdropUrl = (path: string | null, size = BACKDROP_SIZES.large) => {
  if (!path) return '/placeholder.svg';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// API fetching function
const fetchFromTMDb = async (endpoint: string, params = {}) => {
  const url = new URL(`${TMDB_API_URL}${endpoint}`);
  url.searchParams.append('api_key', API_KEY);
  
  // Add any additional parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDb API Error: ${response.status} - ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching from TMDb:', error);
    throw error;
  }
};

// API endpoints
export const api = {
  // Trending
  getTrending: (mediaType: 'all' | 'movie' | 'tv' | 'person' = 'all', timeWindow: 'day' | 'week' = 'week') => 
    fetchFromTMDb(`/trending/${mediaType}/${timeWindow}`),
  
  // Movies
  getPopularMovies: (page = 1) => 
    fetchFromTMDb('/movie/popular', { page }),
  
  getTopRatedMovies: (page = 1) => 
    fetchFromTMDb('/movie/top_rated', { page }),
  
  getUpcomingMovies: (page = 1) => 
    fetchFromTMDb('/movie/upcoming', { page }),
  
  getMovieDetails: (movieId: number) => 
    fetchFromTMDb(`/movie/${movieId}`, { append_to_response: 'videos,credits,similar,watch/providers' }),
  
  // TV Shows
  getPopularTVShows: (page = 1) => 
    fetchFromTMDb('/tv/popular', { page }),
  
  getTopRatedTVShows: (page = 1) => 
    fetchFromTMDb('/tv/top_rated', { page }),
  
  getOnTheAirTVShows: (page = 1) => 
    fetchFromTMDb('/tv/on_the_air', { page }),
  
  getTVShowDetails: (tvId: number) => 
    fetchFromTMDb(`/tv/${tvId}`, { append_to_response: 'videos,credits,similar,watch/providers' }),
  
  // Search
  searchMulti: (query: string, page = 1) => 
    fetchFromTMDb('/search/multi', { query, page }),
  
  searchMovies: (query: string, page = 1) => 
    fetchFromTMDb('/search/movie', { query, page }),
  
  searchTVShows: (query: string, page = 1) => 
    fetchFromTMDb('/search/tv', { query, page }),
  
  searchPeople: (query: string, page = 1) => 
    fetchFromTMDb('/search/person', { query, page }),
  
  // Discover
  discoverMovies: (params: any = {}) => 
    fetchFromTMDb('/discover/movie', params),
  
  discoverTVShows: (params: any = {}) => 
    fetchFromTMDb('/discover/tv', params),
  
  // Genre lists
  getMovieGenres: () => 
    fetchFromTMDb('/genre/movie/list'),
  
  getTVGenres: () => 
    fetchFromTMDb('/genre/tv/list'),
};

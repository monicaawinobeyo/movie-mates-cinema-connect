import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Index from '@/pages/Index';
import Profile from '@/pages/Profile';
import Movies from '@/pages/Movies';
import TVShows from '@/pages/TVShows';
import MovieDetails from '@/pages/MovieDetails';
import TVDetails from '@/pages/TVDetails';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import Rooms from '@/pages/Rooms';
import RoomDetails from '@/pages/RoomDetails';
import CreateRoom from '@/pages/CreateRoom';
import Watchlist from '@/pages/Watchlist';
import Search from '@/pages/Search';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

function App() {
  const { toasts } = useToast();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Index />} />
          <Route path="auth" element={<Auth />} />
          <Route path="movies" element={<Movies />} />
          <Route path="tv" element={<TVShows />} />
          <Route path="movie/:id" element={<MovieDetails />} />
          <Route path="tv/:id" element={<TVDetails />} />
          <Route path="search" element={<Search />} />
          <Route 
            path="profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="watchlist" 
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="rooms" 
            element={
              <ProtectedRoute>
                <Rooms />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="rooms/create" 
            element={
              <ProtectedRoute>
                <CreateRoom />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="rooms/:id" 
            element={
              <ProtectedRoute>
                <RoomDetails />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;

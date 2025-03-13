
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Film, Search, X, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { useMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Main Nav */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center mr-6">
            <Film className="h-6 w-6 mr-2" />
            <span className="font-bold text-xl hidden sm:inline-block">MovieSocial</span>
          </Link>
          
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/movies">Movies</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/tv">TV Shows</Link>
              </Button>
              {user && (
                <Button variant="ghost" asChild>
                  <Link to="/rooms">Watch Rooms</Link>
                </Button>
              )}
            </nav>
          )}
        </div>

        {/* Search and Auth */}
        <div className="flex items-center space-x-2">
          {/* Search Form - Desktop */}
          {!isMobile && !isSearchOpen && (
            <form onSubmit={handleSearch} className="hidden md:flex relative">
              <Input
                type="search"
                placeholder="Search..."
                className="w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                size="sm" 
                variant="ghost" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Mobile Search Icon */}
          {isMobile && !isSearchOpen && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Mobile Search Form */}
          {isMobile && isSearchOpen && (
            <div className="fixed inset-0 z-50 bg-background p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Search</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search movies, tv shows..."
                    className="w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    variant="ghost" 
                    className="absolute right-0 top-0 h-full"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Auth Buttons */}
          {!user ? (
            <Button variant="default" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          ) : (
            <ProfileAvatar />
          )}

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && isMobileMenuOpen && (
        <div className="md:hidden p-4 bg-background border-t">
          <nav className="flex flex-col space-y-2">
            <Button variant="ghost" asChild className="justify-start">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start">
              <Link to="/movies" onClick={() => setIsMobileMenuOpen(false)}>Movies</Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start">
              <Link to="/tv" onClick={() => setIsMobileMenuOpen(false)}>TV Shows</Link>
            </Button>
            {user && (
              <>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/watchlist" onClick={() => setIsMobileMenuOpen(false)}>My Watchlist</Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/rooms" onClick={() => setIsMobileMenuOpen(false)}>Watch Rooms</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

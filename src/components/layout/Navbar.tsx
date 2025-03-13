
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, Menu, Film, Tv2, Home, ListVideo, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    // Close mobile menu when navigating
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };
  
  const navLinks = [
    { label: 'Home', path: '/', icon: <Home size={16} /> },
    { label: 'Movies', path: '/movies', icon: <Film size={16} /> },
    { label: 'TV Shows', path: '/tv', icon: <Tv2 size={16} /> },
    { label: 'My Lists', path: '/watchlist', icon: <ListVideo size={16} />},
  ];
  
  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled || isMenuOpen ? 'bg-background/90 backdrop-blur-md shadow-md' : 'bg-gradient-to-b from-background/90 to-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold mr-6">
              MovieHub
            </Link>
            
            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="hidden md:flex space-x-1">
                {navLinks.map((link) => (
                  <Button
                    key={link.path}
                    variant={isActiveLink(link.path) ? 'default' : 'ghost'}
                    size="sm"
                    asChild
                    className="gap-1.5"
                  >
                    <Link to={link.path}>
                      {link.icon}
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </nav>
            )}
          </div>
          
          {/* Right side elements (search, profile) */}
          <div className="flex items-center space-x-2">
            {/* Search toggle */}
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <Input
                  type="search"
                  placeholder="Search for movies, TV shows..."
                  className="w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSearchOpen(false)}
                  className="ml-1"
                >
                  <X size={20} />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
              >
                <Search size={20} />
              </Button>
            )}
            
            {/* Profile or Auth buttons */}
            {user ? (
              <div className="ml-2">
                <ProfileAvatar />
              </div>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
            
            {/* Mobile menu toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden ml-1"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobile && isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  variant={isActiveLink(link.path) ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className="justify-start"
                >
                  <Link to={link.path} className="flex items-center gap-2">
                    {link.icon}
                    {link.label}
                  </Link>
                </Button>
              ))}
              
              {user && (
                <Button
                  variant={isActiveLink('/profile') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className="justify-start"
                >
                  <Link to="/profile" className="flex items-center gap-2">
                    <User size={16} />
                    Profile
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;

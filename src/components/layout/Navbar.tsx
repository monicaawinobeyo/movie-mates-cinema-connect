
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogin = () => {
    toast({
      title: "Coming Soon",
      description: "Authentication will be implemented with Supabase integration",
    });
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'TV Shows', path: '/tv' },
    { name: 'Movies', path: '/movies' },
    { name: 'My List', path: '/my-list' },
    { name: 'Rooms', path: '/rooms' },
  ];

  return (
    <nav 
      className={cn(
        'fixed w-full z-50 transition-colors duration-300 px-4 md:px-8 py-4 flex items-center justify-between', 
        isScrolled ? 'bg-background' : 'bg-transparent'
      )}
    >
      <div className="flex items-center">
        <Link to="/" className="mr-8">
          <h1 className="text-primary font-bold text-2xl">ReelMates</h1>
        </Link>
        
        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.path ? "text-white" : "text-muted-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          {isSearchOpen ? (
            <div className="flex items-center bg-secondary rounded-md overflow-hidden animate-fade-in">
              <Input 
                type="text" 
                placeholder="Titles, people, genres" 
                className="border-0 bg-transparent h-9 pl-2 focus-visible:ring-0 focus-visible:ring-offset-0" 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setIsSearchOpen(false)}
              >
                <Search size={18} />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={20} />
            </Button>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => toast({ 
            title: "Notifications", 
            description: "You have no new notifications" 
          })}
        >
          <Bell size={20} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleLogin}
        >
          <User size={20} />
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;

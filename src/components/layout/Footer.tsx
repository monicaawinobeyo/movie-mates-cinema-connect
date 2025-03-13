
import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="border-t border-border/20 bg-background py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">ReelMates</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Connect with friends through your favorite movies and TV shows.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon">
                <Github size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram size={20} />
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-sm">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li><Link to="/tv" className="hover:text-primary">TV Shows</Link></li>
              <li><Link to="/movies" className="hover:text-primary">Movies</Link></li>
              <li><Link to="/rooms" className="hover:text-primary">Rooms</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link to="/help" className="hover:text-primary">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-primary">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 border-t border-border/20 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ReelMates. All rights reserved.</p>
          <p className="mt-1">Data provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TMDb</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

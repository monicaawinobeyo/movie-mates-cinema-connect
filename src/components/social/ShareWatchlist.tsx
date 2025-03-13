
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Facebook, 
  Twitter, 
  Link2, 
  Copy, 
  Check, 
  Mail, 
  Share2
} from 'lucide-react';

interface ShareWatchlistProps {
  listType: 'to_watch' | 'watched' | 'favorite';
  userId: string;
}

const ShareWatchlist = ({ listType, userId }: ShareWatchlistProps) => {
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeRatings, setIncludeRatings] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  
  // Generate a sharing URL based on the list type and options
  const getSharingUrl = () => {
    const baseUrl = window.location.origin;
    const shareParams = new URLSearchParams();
    
    shareParams.append('type', listType);
    shareParams.append('user', userId);
    
    if (includeNotes) shareParams.append('notes', 'true');
    if (includeRatings) shareParams.append('ratings', 'true');
    
    return `${baseUrl}/shared-list?${shareParams.toString()}`;
  };
  
  const handleCopyLink = () => {
    const url = getSharingUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
    
    toast({
      title: "Link copied!",
      description: "The sharing link has been copied to your clipboard.",
    });
  };
  
  const handleShareEmail = () => {
    const url = getSharingUrl();
    const subject = `Check out my ${formatListType(listType)} list!`;
    const body = customMessage 
      ? `${customMessage}\n\n${url}` 
      : `I wanted to share my ${formatListType(listType)} list with you. Check it out here: ${url}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShareDialogOpen(false);
  };
  
  const handleShareSocial = (platform: 'facebook' | 'twitter') => {
    const url = getSharingUrl();
    const text = customMessage || `Check out my ${formatListType(listType)} list!`;
    
    let shareUrl = '';
    
    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShareDialogOpen(false);
    }
  };
  
  const formatListType = (type: 'to_watch' | 'watched' | 'favorite'): string => {
    switch (type) {
      case 'to_watch':
        return 'To Watch';
      case 'watched':
        return 'Watched';
      case 'favorite':
        return 'Favorites';
      default:
        return type;
    }
  };
  
  return (
    <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your {formatListType(listType)} list</DialogTitle>
          <DialogDescription>
            Choose how you want to share your list with others.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-4">
            <Label htmlFor="custom-message">Add a message (optional)</Label>
            <Input
              id="custom-message"
              placeholder="Check out what I've been watching!"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="include-notes" className="flex items-center gap-2">
              Include notes
            </Label>
            <Switch
              id="include-notes"
              checked={includeNotes}
              onCheckedChange={setIncludeNotes}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-ratings" className="flex items-center gap-2">
              Include ratings
            </Label>
            <Switch
              id="include-ratings"
              checked={includeRatings}
              onCheckedChange={setIncludeRatings}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="is-public" className="flex items-center gap-2">
              Make list publicly accessible
              <span className="text-xs text-muted-foreground">(Anyone with the link can view)</span>
            </Label>
            <Switch
              id="is-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            <Label>Share via</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 h-auto gap-1" 
                onClick={() => handleShareSocial('facebook')}
              >
                <Facebook className="h-5 w-5" />
                <span className="text-xs">Facebook</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 h-auto gap-1" 
                onClick={() => handleShareSocial('twitter')}
              >
                <Twitter className="h-5 w-5" />
                <span className="text-xs">Twitter</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 h-auto gap-1" 
                onClick={handleShareEmail}
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs">Email</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 h-auto gap-1" 
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                <span className="text-xs">Copy Link</span>
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="secondary" onClick={() => setShareDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWatchlist;

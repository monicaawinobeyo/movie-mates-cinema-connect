
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Star, Eye } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

interface AddToListDialogProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
}

type ListType = 'to_watch' | 'watched' | 'favorite';

const AddToListDialog = ({ mediaId, mediaType, title }: AddToListDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm({
    defaultValues: {
      listType: 'to_watch' as ListType,
    }
  });
  
  const handleAddToList = async (data: { listType: ListType }) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your lists",
        variant: "destructive"
      });
      setIsOpen(false);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if already exists in the same list
      const { data: existingData, error: checkError } = await supabase
        .from('user_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .eq('list_type', data.listType);
      
      if (checkError) throw checkError;
      
      // If already exists, show a message
      if (existingData && existingData.length > 0) {
        toast({
          title: "Already in your list",
          description: `"${title}" is already in your ${formatListType(data.listType)} list`,
        });
        setIsOpen(false);
        setIsSubmitting(false);
        return;
      }
      
      // Insert into the list
      const { error } = await supabase
        .from('user_lists')
        .insert([{
          user_id: user.id,
          media_id: mediaId,
          media_type: mediaType,
          list_type: data.listType
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Added to list",
        description: `"${title}" has been added to your ${formatListType(data.listType)} list`,
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding to list:', error);
      toast({
        title: "Error",
        description: "Could not add to your list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatListType = (listType: ListType): string => {
    switch (listType) {
      case 'to_watch':
        return 'To Watch';
      case 'watched':
        return 'Watched';
      case 'favorite':
        return 'Favorites';
      default:
        return listType;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to your lists</DialogTitle>
          <DialogDescription>
            Add "{title}" to one of your lists
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddToList)} className="space-y-6">
            <FormField
              control={form.control}
              name="listType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                        <RadioGroupItem value="to_watch" id="to_watch" />
                        <Label htmlFor="to_watch" className="flex items-center gap-2 cursor-pointer">
                          <Clock className="h-4 w-4" />
                          <span>To Watch</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                        <RadioGroupItem value="watched" id="watched" />
                        <Label htmlFor="watched" className="flex items-center gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" />
                          <span>Watched</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                        <RadioGroupItem value="favorite" id="favorite" />
                        <Label htmlFor="favorite" className="flex items-center gap-2 cursor-pointer">
                          <Star className="h-4 w-4" />
                          <span>Favorites</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add to List'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddToListDialog;

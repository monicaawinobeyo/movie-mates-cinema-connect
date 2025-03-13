
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const CreateRoom = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomCode = () => {
    // Generate a random 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create the room
      const roomCode = generateRoomCode();
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert([
          {
            name,
            description: description.trim() || null,
            created_by: user.id,
            room_code: roomCode,
            is_private: isPrivate
          }
        ] as any)
        .select('id')
        .single();
      
      if (roomError) throw roomError;
      
      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert([
          {
            room_id: roomData?.id,
            user_id: user.id,
            role: 'admin'
          }
        ] as any);
      
      if (memberError) throw memberError;
      
      toast({
        title: "Room created",
        description: "Your watch room has been created successfully"
      });
      
      navigate(`/rooms/${roomData?.id}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: "Error creating room",
        description: error.message || "An error occurred while creating the room",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Watch Room</h1>
        
        <Card>
          <form onSubmit={handleCreateRoom}>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for your room"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room-description">Description (Optional)</Label>
                <Textarea
                  id="room-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this room is about"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="private-room">Private Room</Label>
                  <p className="text-sm text-muted-foreground">
                    Private rooms are only visible to members
                  </p>
                </div>
                <Switch
                  id="private-room"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/rooms')}
                  className="sm:flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating} 
                  className="sm:flex-1"
                >
                  {isCreating ? 'Creating...' : 'Create Room'}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateRoom;

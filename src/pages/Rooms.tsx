
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Room, Tables } from '@/types/supabase';

interface RoomMemberWithRoom {
  room_id: string;
  rooms: Room;
}

const Rooms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRooms = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('room_members')
          .select(`
            room_id,
            rooms:room_id(
              id,
              name,
              description,
              room_code,
              is_private,
              created_at
            )
          `)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const typedData = data as unknown as RoomMemberWithRoom[];
        const rooms = typedData.map(item => item.rooms).filter(Boolean);
        setUserRooms(rooms);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast({
          title: "Error loading rooms",
          description: "Could not load your watch rooms. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserRooms();
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p>Loading your watch rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Watch Rooms</h1>
        <Button asChild>
          <Link to="/rooms/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Room
          </Link>
        </Button>
      </div>
      
      {userRooms.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No watch rooms yet</h2>
          <p className="text-muted-foreground mb-6">
            Create a watch room to discuss and recommend movies and TV shows with friends
          </p>
          <Button asChild>
            <Link to="/rooms/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Room
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userRooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{room.description || 'No description'}</p>
                <div className="mt-4">
                  <p className="text-sm">
                    <span className="font-semibold">Room Code:</span> {room.room_code}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Visibility:</span> {room.is_private ? 'Private' : 'Public'}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/rooms/${room.id}`}>
                    Enter Room
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rooms;

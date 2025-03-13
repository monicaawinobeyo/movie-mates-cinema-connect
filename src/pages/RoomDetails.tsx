
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Room, RoomMember, Tables } from '@/types/supabase';

const RoomDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserMember, setIsUserMember] = useState(false);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!id || !user) return;
      
      try {
        // Fetch room data
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', id)
          .single();
        
        if (roomError) throw roomError;
        
        setRoom(roomData as Room);
        
        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('room_members')
          .select(`
            id,
            user_id,
            role,
            profiles:user_id(
              username,
              avatar_url
            )
          `)
          .eq('room_id', id);
        
        if (membersError) throw membersError;
        
        setMembers(membersData as unknown as RoomMember[]);
        
        // Check if current user is a member
        const typedMembersData = membersData as unknown as RoomMember[];
        const userIsMember = typedMembersData.some(member => member.user_id === user.id);
        setIsUserMember(userIsMember);
      } catch (error) {
        console.error('Error fetching room details:', error);
        toast({
          title: "Error loading room",
          description: "Could not load the room details. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoomDetails();
  }, [id, user, toast]);

  const handleJoinRoom = async () => {
    if (!user || !room) return;
    
    try {
      const { error } = await supabase
        .from('room_members')
        .insert([
          {
            room_id: room.id,
            user_id: user.id,
            role: 'member'
          }
        ]);
      
      if (error) throw error;
      
      toast({
        title: "Joined room",
        description: "You have successfully joined the room"
      });
      
      setIsUserMember(true);
      
      // Refetch members
      const { data, error: membersError } = await supabase
        .from('room_members')
        .select(`
          id,
          user_id,
          role,
          profiles:user_id(
            username,
            avatar_url
          )
        `)
        .eq('room_id', room.id);
      
      if (membersError) throw membersError;
      
      setMembers(data as unknown as RoomMember[]);
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error joining room",
        description: "Could not join the room. Please try again later.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p>Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Room not found</h2>
          <p className="text-muted-foreground mb-6">
            The room you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <a href="/rooms">Back to Rooms</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{room.name}</h1>
          {room.description && (
            <p className="text-muted-foreground mt-2">{room.description}</p>
          )}
          <div className="flex items-center mt-4 text-sm text-muted-foreground">
            <span className="mr-4">Room Code: {room.room_code}</span>
            <span>{room.is_private ? 'Private Room' : 'Public Room'}</span>
          </div>
        </div>
        
        {!isUserMember && (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p>You're not a member of this room yet.</p>
                <p className="text-sm text-muted-foreground">Join to participate in discussions and recommendations</p>
              </div>
              <Button onClick={handleJoinRoom}>Join Room</Button>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>Movie & TV Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {isUserMember ? (
                  <div className="text-center py-8">
                    <p className="mb-4">No recommendations yet.</p>
                    <Button>Add Recommendation</Button>
                  </div>
                ) : (
                  <p className="text-center py-8">Join the room to see and share recommendations</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Room Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={member.profiles?.avatar_url || ""} />
                          <AvatarFallback>
                            {member.profiles?.username?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.profiles?.username || "User"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RoomDetails;


import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Profile as ProfileType } from '@/types/supabase';
import { Loader2, Upload } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setProfile(data as ProfileType);
          setUsername(data?.username || '');
          setBio(data?.bio || '');
          setFavoriteGenres(data?.favorite_genres || '');
        } else {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ 
              id: user.id, 
              username: user.email?.split('@')[0] || '', 
              updated_at: new Date().toISOString()
            }])
            .select('*')
            .single();
          
          if (createError) throw createError;
          
          setProfile(newProfile as ProfileType);
          setUsername(newProfile?.username || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error fetching profile",
          description: "Could not load your profile. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updates = {
        username,
        bio,
        favorite_genres: favoriteGenres,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      setProfile(prev => prev ? { ...prev, username, bio, favorite_genres: favoriteGenres } : null);
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "An error occurred while updating your profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Profile picture must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Profile picture must be JPEG, PNG, or WebP",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload to Supabase Storage
      const fileName = `avatar-${user.id}-${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) throw new Error('Failed to get public URL');

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrlData.publicUrl } : null);

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error uploading profile picture",
        description: error.message || "An error occurred while uploading your profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-shrink-0 relative group">
                    <Avatar className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleAvatarClick}>
                      {isUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      ) : (
                        <>
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="text-2xl">
                            {username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  <form onSubmit={handleUpdateProfile} className="flex-1 space-y-4 w-full">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ''} disabled />
                      <p className="text-sm text-muted-foreground mt-1">Your email cannot be changed</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us a bit about yourself"
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Viewing Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="favoriteGenres">Favorite Genres</Label>
                    <Textarea 
                      id="favoriteGenres" 
                      value={favoriteGenres} 
                      onChange={(e) => setFavoriteGenres(e.target.value)}
                      placeholder="Enter your favorite genres (e.g., Action, Comedy, Drama)"
                      className="min-h-[100px]"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Separate genres with commas</p>
                  </div>
                  
                  <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;

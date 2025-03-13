
-- First, drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;

-- Create a security definer function to check if a user is a member of a room
CREATE OR REPLACE FUNCTION public.is_room_member(room_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_members.room_id = $1 AND room_members.user_id = $2
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view room members" 
  ON public.room_members FOR SELECT 
  USING (public.is_room_member(room_id, auth.uid()));

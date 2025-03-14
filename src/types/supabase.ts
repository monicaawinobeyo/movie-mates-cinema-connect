
// Define types for Supabase database tables
export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  bio: string | null;
  favorite_genres: string | null;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  room_code: string;
  is_private: boolean;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface UserListItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  list_type: 'watched' | 'favorite' | 'to_watch';
  added_at: string;
}

// Define Database type helper for Supabase
export type Tables = {
  profiles: Profile;
  rooms: Room;
  room_members: RoomMember;
  user_lists: UserListItem;
}

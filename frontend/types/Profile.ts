export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_likes_received: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  created_at: string;
}

export interface UpdateProfileData {
  full_name?: string;
  bio?: string;
}

export interface ProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

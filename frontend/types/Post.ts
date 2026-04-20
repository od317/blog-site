export interface Comment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  parent_id: string | null;
  reply_count: number;
  replies?: Comment[];
  created_at: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string | null; // Add this
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
  isPending?: boolean;
  error?: string;
}

export interface ProfilePost {
  id: string;
  title: string;
  excerpt: string;
  image_url?: string | null; // Add this
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  readingTime: string;
  created_at: string;
}

export interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PostsResponse {
  posts: ProfilePost[];
  pagination: PaginationData;
}

export interface CreatePostData {
  title: string;
  content: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
}

export interface PostResponse {
  success: boolean;
  post: Post;
  message?: string;
}

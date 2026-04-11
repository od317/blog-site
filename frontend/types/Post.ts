export interface Comment {
  id: string;
  post_id: string;
  content: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
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

// ============================================
// PROFILE POST TYPES (for list view)
// ============================================
export interface ProfilePost {
  id: string;
  title: string;
  excerpt: string;
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

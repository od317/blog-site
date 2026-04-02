import { create } from "zustand";
import { api } from "@/lib/api/client";
import { config } from "@/lib/config";

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
}

interface PostStore {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  createPost: (data: { title: string; content: string }) => Promise<void>;
  addNewPost: (post: Post) => void;
  updatePostInList: (post: Post) => void;
  removePost: (postId: string) => void;
  updateLikeCount: (
    postId: string,
    likeCount: number,
    userHasLiked: boolean,
  ) => void;
  updateCommentCount: (postId: string) => void;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const posts = await api.get<Post[]>("/posts");
      set({ posts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createPost: async (data) => {
    set({ isLoading: true, error: null });
    try {
      console.log("=== POST STORE CREATE ===");
      console.log("Sending post data:", data);
      console.log("Using API URL:", config.apiUrl);

      // Use the api client instead of fetch - it already handles cookies
      const post = await api.post<Post>("/posts", {
        title: data.title,
        content: data.content,
      });

      console.log("Post created successfully, waiting for WebSocket event");

      set({ isLoading: false });
    } catch (error: any) {
      console.error("Create post error:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addNewPost: (post) => {
    set((state) => ({
      posts: [post, ...state.posts],
    }));
  },

  updatePostInList: (updatedPost) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post,
      ),
    }));
  },

  removePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    }));
  },

  updateLikeCount: (postId, likeCount, userHasLiked) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, like_count: likeCount, user_has_liked: userHasLiked }
          : post,
      ),
    }));
  },

  updateCommentCount: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, comment_count: post.comment_count + 1 }
          : post,
      ),
    }));
  },
}));

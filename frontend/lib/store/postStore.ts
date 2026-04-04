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
  isPending?: boolean; // Flag for optimistic posts
  error?: string; // Error message if creation failed
}

interface PostStore {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  createPost: (data: { title: string; content: string }) => Promise<void>;
  retryPost: (
    postId: string,
    data: { title: string; content: string },
  ) => Promise<void>;
  removePost: (postId: string) => void;
  addNewPost: (post: Post) => void;
  updatePostInList: (post: Post) => void;
  updateLikeCount: (
    postId: string,
    likeCount: number,
    userHasLiked: boolean,
  ) => void;
  updateCommentCount: (postId: string) => void;
  clearFailedPosts: () => void;
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
    const { title, content } = data;

    // Generate temporary ID for optimistic post
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const currentUser = JSON.parse(localStorage.getItem("auth-storage") || "{}")
      ?.state?.user;

    // Create optimistic post
    const optimisticPost: Post = {
      id: tempId,
      title,
      content,
      user_id: currentUser?.id || "pending",
      username: currentUser?.username || "You",
      full_name: currentUser?.full_name || null,
      avatar_url: currentUser?.avatar_url || null,
      like_count: 0,
      comment_count: 0,
      user_has_liked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isPending: true, // Mark as pending
    };

    // Add optimistic post to the list immediately
    set((state) => ({
      posts: [optimisticPost, ...state.posts],
      isLoading: false,
    }));

    try {
      const stored = localStorage.getItem("auth-storage");
      if (!stored) throw new Error("Not authenticated");

      const parsed = JSON.parse(stored);
      const token = parsed.state?.token;

      if (!token) throw new Error("No token found");

      // Make the actual API call
      const response = await fetch(`${config.apiUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      const realPost = await response.json();

      // Replace optimistic post with real post
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === tempId ? { ...realPost, isPending: false } : post,
        ),
      }));

      return realPost;
    } catch (error: any) {
      // Mark the optimistic post as failed
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === tempId
            ? {
                ...post,
                isPending: false,
                error: error.message || "Failed to create post",
              }
            : post,
        ),
      }));

      throw error;
    }
  },

  retryPost: async (
    postId: string,
    data: { title: string; content: string },
  ) => {
    // Mark post as pending again
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, isPending: true, error: undefined }
          : post,
      ),
    }));

    try {
      const stored = localStorage.getItem("auth-storage");
      if (!stored) throw new Error("Not authenticated");

      const parsed = JSON.parse(stored);
      const token = parsed.state?.token;

      if (!token) throw new Error("No token found");

      const response = await fetch(`${config.apiUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      const realPost = await response.json();

      // Replace failed post with real post
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId ? { ...realPost, isPending: false } : post,
        ),
      }));
    } catch (error: any) {
      // Keep the error state
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isPending: false,
                error: error.message || "Failed to create post",
              }
            : post,
        ),
      }));
      throw error;
    }
  },

  removePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    }));
  },

  addNewPost: (post) => {
    // Check if post already exists (avoid duplicates)
    set((state) => {
      const exists = state.posts.some((p) => p.id === post.id);
      if (exists) return state;
      return {
        posts: [post, ...state.posts.filter((p) => !p.id.startsWith("temp-"))],
      };
    });
  },

  updatePostInList: (updatedPost) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post,
      ),
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

  clearFailedPosts: () => {
    set((state) => ({
      posts: state.posts.filter((post) => !post.error),
    }));
  },
}));

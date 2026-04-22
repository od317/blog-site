// lib/store/postStore.ts
import { create } from "zustand";
import { api } from "@/lib/api/client";
import { useAuthStore } from "./authStore";
import { getErrorMessage } from "@/types/error";
import { Post } from "@/types/Post";

interface PostStore {
  posts: Post[];
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  currentSort: string;
  hasMore: boolean;
  currentOffset: number;

  fetchPosts: (sort?: string, append?: boolean) => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  createPost: (data: { title: string; content: string }) => Promise<Post>;
  ensurePost: (post: Post) => void;
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
  updateCommentCount: (postId: string, newCount: number) => void;
  clearFailedPosts: () => void;
  resetPagination: () => void;
}

const LIMIT = 10; // Posts per page

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  isLoading: true,
  isFetchingMore: false,
  error: null,
  currentSort: "latest",
  hasMore: true,
  currentOffset: 0,

  resetPagination: () => {
    set({
      currentOffset: 0,
      hasMore: true,
      posts: [],
    });
  },

  fetchPosts: async (sort = "latest", append = false) => {
    const state = get();

    // If appending, use fetchingMore flag
    if (append) {
      set({ isFetchingMore: true, error: null });
    } else {
      set({ isLoading: true, error: null, currentSort: sort, posts: [] });
    }

    try {
      const offset = append ? state.currentOffset : 0;

      const response = await api.get<Post[]>(
        `/posts?sort=${sort}&limit=${LIMIT}&offset=${offset}`,
      );

      const newPosts = response;
      const hasMore = newPosts.length === LIMIT;

      set((state) => ({
        posts: append ? [...state.posts, ...newPosts] : newPosts,
        isLoading: false,
        isFetchingMore: false,
        currentSort: sort,
        currentOffset: append ? offset + newPosts.length : newPosts.length,
        hasMore,
      }));
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({
        error: message,
        isLoading: false,
        isFetchingMore: false,
      });
    }
  },

  fetchMorePosts: async () => {
    const { currentSort, hasMore, isFetchingMore, isLoading } = get();

    // Don't fetch if already loading or no more posts
    if (isFetchingMore || isLoading || !hasMore) return;

    await get().fetchPosts(currentSort, true);
  },

  ensurePost: (post) => {
    const exists = get().posts.some((p) => p.id === post.id);
    if (!exists) {
      console.log("📥 Ensuring post in store:", post.id);
      set((state) => ({
        posts: [post, ...state.posts],
      }));
    }
  },

  createPost: async (data) => {
    const { title, content } = data;
    const currentUser = useAuthStore.getState().user;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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
      isPending: true,
    };

    set((state) => ({
      posts: [optimisticPost, ...state.posts],
    }));

    try {
      const realPost = await api.post<Post>("/posts", { title, content });

      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === tempId ? { ...realPost, isPending: false } : post,
        ),
      }));

      return realPost;
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === tempId
            ? { ...post, isPending: false, error: message }
            : post,
        ),
      }));

      throw new Error(message);
    }
  },

  retryPost: async (
    postId: string,
    data: { title: string; content: string },
  ) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, isPending: true, error: undefined }
          : post,
      ),
    }));

    try {
      const realPost = await api.post<Post>("/posts", {
        title: data.title,
        content: data.content,
      });

      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId ? { ...realPost, isPending: false } : post,
        ),
      }));
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId
            ? { ...post, isPending: false, error: message }
            : post,
        ),
      }));

      throw new Error(message);
    }
  },

  removePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    }));
  },

  addNewPost: (post) => {
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
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post,
      ),
    }));
  },

  updateLikeCount: (postId, likeCount, userHasLiked) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              like_count: likeCount,
              ...(userHasLiked !== undefined && {
                user_has_liked: userHasLiked,
              }),
            }
          : post,
      ),
    }));
  },

  updateCommentCount: (postId, newCount) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, comment_count: newCount } : post,
      ),
    }));
  },

  clearFailedPosts: () => {
    set((state) => ({
      posts: state.posts.filter((post) => !post.error),
    }));
  },
}));

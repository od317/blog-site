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
  hasMore: boolean;
  currentOffset: number;
  currentSort: string; // Add current sort tracking

  fetchPosts: (sort: string, append?: boolean) => Promise<void>;
  hydrate: (posts: Post[], sort: string) => void;
  setInitialPosts: (posts: Post[], sort: string) => void;
  fetchMorePosts: (sort: string) => Promise<void>;
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

const LIMIT = 10;

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  isLoading: false,
  isFetchingMore: false,
  error: null,
  hasMore: true,
  currentOffset: 0,
  currentSort: "latest",
  hydrate: (posts: Post[], sort: string) => {
    set({
      posts,
      isLoading: false,
      hasMore: posts.length === LIMIT,
      currentOffset: posts.length,
      currentSort: sort,
    });
  },
  resetPagination: () => {
    set({
      currentOffset: 0,
      hasMore: true,
      posts: [],
      isLoading: true, // Set loading to true when resetting pagination
    });
  },

  // lib/store/postStore.ts - Update fetchPosts
  setInitialPosts: (posts: Post[], sort: string) => {
    set({
      posts,
      isLoading: false,
      hasMore: posts.length === LIMIT,
      currentOffset: posts.length,
      currentSort: sort,
    });
  },
  fetchPosts: async (sort: string, append = false) => {
    const state = get();

    if (!append) {
      // Only show loading if we're changing sorts
      if (state.currentSort !== sort) {
        set({
          isLoading: true,
          error: null,
          currentSort: sort,
        });
      }
    } else {
      set({ isFetchingMore: true, error: null });
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

  fetchMorePosts: async (sort: string) => {
    const { hasMore, isFetchingMore, isLoading } = get();

    if (isFetchingMore || isLoading || !hasMore) return;

    await get().fetchPosts(sort, true);
  },

  ensurePost: (post) => {
    console.log(post, get().posts);
    const exists = get().posts.some((p) => p.id === post.id);
    if (!exists) {
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

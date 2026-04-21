import { create } from "zustand";
import { api } from "@/lib/api/client";
import type {
  GroupedNotification,
  NotificationsResponse,
} from "@/types/notification";

interface NotificationStore {
  notifications: GroupedNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  offset: number;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  markPostAsRead: (postId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: GroupedNotification) => void;
  incrementUnreadCount: () => void;
}

const LIMIT = 20;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  offset: 0,

  fetchNotifications: async (reset = false) => {
    const { isLoading, hasMore, offset } = get();

    if (isLoading) return;
    if (!reset && !hasMore) return;

    set({ isLoading: true });

    try {
      const newOffset = reset ? 0 : offset;
      const response = await api.get<NotificationsResponse>(
        `/notifications?limit=${LIMIT}&offset=${newOffset}`,
      );

      set((state) => ({
        notifications: reset
          ? response.notifications
          : [...state.notifications, ...response.notifications],
        unreadCount: response.unreadCount,
        hasMore: response.pagination.hasMore,
        offset: newOffset + response.notifications.length,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isLoading: false });
    }
  },

  markPostAsRead: async (postId: string) => {
    try {
      await api.put(`/notifications/posts/${postId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.post_id === postId ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(
          0,
          state.unreadCount -
            state.notifications.filter((n) => n.post_id === postId && !n.read)
              .length,
        ),
      }));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },

  addNotification: (notification: GroupedNotification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  incrementUnreadCount: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },
}));

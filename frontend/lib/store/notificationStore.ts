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
  markAsRead: (
    notificationId: string,
    type: string,
    postId?: string | null,
    actorId?: string,
  ) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addOrUpdateNotification: (notification: GroupedNotification) => void;
  removeNotification: (type: string, postId: string, actorId: string) => void;
  refreshUnreadCount: () => Promise<void>;
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

  refreshUnreadCount: async () => {
    try {
      const response = await api.get<{ count: number }>("/notifications/unread-count");
      set({ unreadCount: response.count });
    } catch (error) {
      console.error("Failed to refresh unread count:", error);
    }
  },

  markAsRead: async (
    notificationId: string,
    type: string,
    postId?: string | null,
    actorId?: string,
  ) => {
    try {
      let url: string;

      if (type === "follow" && actorId) {
        url = `/notifications/follow/${actorId}/read`;
      } else if (postId) {
        url = `/notifications/posts/${postId}/read?type=${type}`;
      } else {
        console.error("Cannot mark notification as read: missing identifier");
        return;
      }

      await api.put(url);

      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          n.notification_id === notificationId ? { ...n, read: true } : n,
        );
        
        const newUnreadCount = updatedNotifications.filter((n) => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount: newUnreadCount,
        };
      });
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

  addOrUpdateNotification: (notification: GroupedNotification) => {
    set((state) => {
      // Find if this notification group already exists
      const existingIndex = state.notifications.findIndex(
        (n) => n.notification_id === notification.notification_id
      );

      if (existingIndex !== -1) {
        // Update existing notification - DO NOT change unread count
        const existing = state.notifications[existingIndex];
        
        const mergedNotification = {
          ...notification,
          read: existing.read, // Preserve read status
          actor_count: Math.max(existing.actor_count, notification.actor_count),
          actor_usernames: Array.from(new Set([...existing.actor_usernames, ...notification.actor_usernames])).slice(0, 5),
          actor_full_names: Array.from(new Set([...existing.actor_full_names, ...notification.actor_full_names])).slice(0, 5),
          actor_avatars: Array.from(new Set([...existing.actor_avatars, ...notification.actor_avatars])).slice(0, 5),
        };
        
        const updatedNotifications = [...state.notifications];
        updatedNotifications[existingIndex] = mergedNotification;
        
        updatedNotifications.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        return {
          notifications: updatedNotifications,
        };
      }
      
      // New notification - add to top and increment unread count
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.read ? 0 : 1),
      };
    });
  },

  removeNotification: (type: string, postId: string, actorId: string) => {
    set((state) => {
      const notificationKey = `${postId}-${type}`;
      const existingIndex = state.notifications.findIndex(
        (n) => n.notification_id.includes(notificationKey)
      );
      
      if (existingIndex === -1) return state;
      
      const existing = state.notifications[existingIndex];
      
      // If only one actor, remove the entire notification
      if (existing.actor_count <= 1) {
        const updatedNotifications = [...state.notifications];
        updatedNotifications.splice(existingIndex, 1);
        
        return {
          notifications: updatedNotifications,
          unreadCount: state.unreadCount - (existing.read ? 0 : 1),
        };
      }
      
      // Multiple actors - just decrease count and remove the actor
      const updatedNotification = {
        ...existing,
        actor_count: existing.actor_count - 1,
        actor_usernames: existing.actor_usernames.filter(
          (_, i) => i !== existing.actor_usernames.findIndex(
            (name, idx) => name === `actor-${actorId}` && idx === i
          )
        ),
      };
      
      const updatedNotifications = [...state.notifications];
      updatedNotifications[existingIndex] = updatedNotification;
      
      return {
        notifications: updatedNotifications,
      };
    });
  },
}));
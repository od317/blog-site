import { create } from "zustand";
import { Notification, NotificationType } from "@/types/notification";

interface NotificationStore {
  notifications: Notification[];
  addNotification: (
    message: string,
    type: NotificationType,
    duration?: number,
  ) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (
    message: string,
    type: NotificationType,
    duration: number = 5000,
  ) => {
    const id = Math.random().toString(36).substring(2, 11);
    const notification: Notification = {
      id,
      type,
      message,
      duration,
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        const { notifications } = get();
        if (notifications.some((n) => n.id === id)) {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        }
      }, duration);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));

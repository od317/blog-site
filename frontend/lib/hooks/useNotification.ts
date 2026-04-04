import { useNotificationStore } from "@/lib/store/notificationStore";
import { NotificationType } from "@/types/notification";

export function useNotification() {
  const { addNotification, removeNotification, clearAll } =
    useNotificationStore();

  const showSuccess = (message: string, duration?: number) => {
    addNotification(message, "success", duration);
  };

  const showError = (message: string, duration?: number) => {
    addNotification(message, "error", duration);
  };

  const showWarning = (message: string, duration?: number) => {
    addNotification(message, "warning", duration);
  };

  const showInfo = (message: string, duration?: number) => {
    addNotification(message, "info", duration);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAll,
  };
}

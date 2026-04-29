import type { GroupedNotification } from "@/types/notification";

export const getDisplayNames = (notification: GroupedNotification): string => {
  const { actor_count, latest_actor_username, actor_usernames } = notification;
  const otherCount = actor_count - 1;

  if (actor_count === 1) {
    return latest_actor_username;
  }

  if (actor_count === 2) {
    const otherName = actor_usernames.find(name => name !== latest_actor_username);
    return `${latest_actor_username} and ${otherName || "1 other"}`;
  }

  return `${latest_actor_username} and ${otherCount} others`;
};

export const getNotificationHref = (notification: GroupedNotification): string => {
  if (notification.type === "follow") {
    return `/profile/${notification.latest_actor_username}`;
  }
  if (notification.post_id) {
    return `/posts/${notification.post_id}`;
  }
  return "/";
};

export const getNotificationMessage = (notification: GroupedNotification): string => {
  const { type, actor_count, post_title } = notification;
  const displayNames = getDisplayNames(notification);
  const postText = post_title ? `"${post_title}"` : "a post";

  if (type === "follow") {
    return `${displayNames} started following you`;
  }

  if (type === "comment") {
    return `${displayNames} commented on your post ${postText}`;
  }

  if (type === "reply") {
    return `${displayNames} replied to your comment on ${postText}`;
  }

  if (type === "reply_on_post") {
    return `${displayNames} replied on your post ${postText}`;
  }

  if (type === "save") {
    return `${displayNames} saved your post ${postText}`;
  }

  return `${displayNames} liked your post ${postText}`;
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
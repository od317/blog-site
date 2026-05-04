export interface GroupedNotification {
  type: string;
  post_id: string | null;
  post_title: string | null;
  read: boolean;
  created_at: string;
  actor_count: number;
  notification_id: string;
  latest_actor_username: string;
  latest_actor_full_name: string | null;
  latest_actor_avatar: string | null;
  actor_usernames: string[];
  actor_full_names: (string | null)[];
  actor_avatars: (string | null)[];
  comment_ids?: string[];
  comment_previews?: string[];
  latest_comment_id?: string;
  latest_comment_preview?: string;
  actor_id?: string;
}

export interface NotificationsResponse {
  notifications: GroupedNotification[];
  unreadCount: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// frontend/types/notification.ts

export interface NotificationSocketData {
  type: string;
  postId?: string;
  postTitle?: string;
  commentId?: string;
  parentCommentId?: string;
  followerUsername?: string;
  followerFullName?: string;
  followerAvatar?: string;
}

export interface NotificationRemovedData {
  type: string;
  postId: string;
  commentId?: string;
  parentCommentId?: string;
  actorId: string;
}

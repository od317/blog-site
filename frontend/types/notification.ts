export interface GroupedNotification {
  type: string;
  post_id: string;
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

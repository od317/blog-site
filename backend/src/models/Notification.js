const pool = require("../config/database");

class Notification {
  // Create notifications table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_type_post ON notifications(user_id, type, post_id);
    `;

    await pool.query(query);
    console.log("✅ Notifications table ready");
  }

  // Create a single notification
  static async create(data) {
    const { userId, type, actorId, postId } = data;

    const query = `
      INSERT INTO notifications (user_id, type, actor_id, post_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [userId, type, actorId, postId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get grouped notifications for a user
  // Simpler version - get all notifications and group on the fly
  static async getGroupedByUser(userId, limit = 20, offset = 0) {
    // First get the distinct posts with their latest notification time
    const postsQuery = `
    SELECT 
      post_id,
      MAX(created_at) as latest_created
    FROM notifications
    WHERE user_id = $1 AND type = 'like'
    GROUP BY post_id
    ORDER BY latest_created DESC
    LIMIT $2 OFFSET $3
  `;

    const postsResult = await pool.query(postsQuery, [userId, limit, offset]);

    if (postsResult.rows.length === 0) {
      return [];
    }

    const postIds = postsResult.rows.map((row) => row.post_id);

    // Get all notifications for these posts
    const notificationsQuery = `
    SELECT 
      n.*,
      u.username as actor_username,
      u.full_name as actor_full_name,
      u.avatar_url as actor_avatar,
      p.title as post_title
    FROM notifications n
    JOIN users u ON n.actor_id = u.id
    LEFT JOIN posts p ON n.post_id = p.id
    WHERE n.user_id = $1 
      AND n.type = 'like'
      AND n.post_id = ANY($2::uuid[])
    ORDER BY n.created_at DESC
  `;

    const notificationsResult = await pool.query(notificationsQuery, [
      userId,
      postIds,
    ]);

    // Group by post_id
    const groupedMap = new Map();

    for (const notif of notificationsResult.rows) {
      if (!groupedMap.has(notif.post_id)) {
        groupedMap.set(notif.post_id, {
          type: "like",
          post_id: notif.post_id,
          post_title: notif.post_title,
          read: notif.read,
          created_at: notif.created_at,
          actor_count: 0,
          actor_usernames: [],
          actor_full_names: [],
          actor_avatars: [],
          latest_actor_username: notif.actor_username,
          latest_actor_full_name: notif.actor_full_name,
          latest_actor_avatar: notif.actor_avatar,
          notification_id: `${notif.post_id}-${notif.created_at.getTime()}`,
        });
      }

      const group = groupedMap.get(notif.post_id);
      group.actor_count++;

      // Update latest if this notification is newer
      if (new Date(notif.created_at) > new Date(group.created_at)) {
        group.created_at = notif.created_at;
        group.latest_actor_username = notif.actor_username;
        group.latest_actor_full_name = notif.actor_full_name;
        group.latest_actor_avatar = notif.actor_avatar;
        group.read = notif.read;
      }

      // Add actor to list (limit to 5)
      if (
        group.actor_usernames.length < 5 &&
        !group.actor_usernames.includes(notif.actor_username)
      ) {
        group.actor_usernames.push(notif.actor_username);
        group.actor_full_names.push(notif.actor_full_name);
        group.actor_avatars.push(notif.actor_avatar);
      }
    }

    // Convert map to array and sort by created_at
    const results = Array.from(groupedMap.values());
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return results;
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND read = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // Mark all as read for a specific post
  static async markPostNotificationsAsRead(userId, postId) {
    const query = `
      UPDATE notifications 
      SET read = true 
      WHERE user_id = $1 AND post_id = $2 AND read = false
    `;
    await pool.query(query, [userId, postId]);
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET read = true 
      WHERE user_id = $1 AND read = false
    `;
    await pool.query(query, [userId]);
  }
}

module.exports = Notification;

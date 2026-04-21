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
      comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_type_post ON notifications(user_id, type, post_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON notifications(comment_id);
  `;

    await pool.query(query);
    console.log("✅ Notifications table ready");
  }

  // ✅ SINGLE create method (with commentId)
  static async create(data) {
    const { userId, type, actorId, postId, commentId } = data;

    const query = `
      INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [userId, type, actorId, postId, commentId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get grouped notifications for a user
  static async getGroupedByUser(userId, limit = 20, offset = 0) {
    // Get distinct (post_id, type, read) groups with latest timestamp
    const groupsQuery = `
    SELECT 
      post_id,
      type,
      read,
      MAX(created_at) as latest_created
    FROM notifications
    WHERE user_id = $1
    GROUP BY post_id, type, read
    ORDER BY 
      read ASC,
      latest_created DESC
    LIMIT $2 OFFSET $3
  `;

    const groupsResult = await pool.query(groupsQuery, [userId, limit, offset]);

    if (groupsResult.rows.length === 0) {
      return [];
    }

    const postIds = [...new Set(groupsResult.rows.map((row) => row.post_id))];

    // Get ALL notifications for these posts
    const notificationsQuery = `
    SELECT 
      n.*,
      u.username as actor_username,
      u.full_name as actor_full_name,
      u.avatar_url as actor_avatar,
      p.title as post_title,
      c.content as comment_content
    FROM notifications n
    JOIN users u ON n.actor_id = u.id
    LEFT JOIN posts p ON n.post_id = p.id
    LEFT JOIN comments c ON n.comment_id = c.id
    WHERE n.user_id = $1 
      AND n.post_id = ANY($2::uuid[])
    ORDER BY n.created_at DESC
  `;

    const allNotifications = await pool.query(notificationsQuery, [
      userId,
      postIds,
    ]);

    // Group by composite key (post_id + type + read)
    const groupedMap = new Map();

    for (const notif of allNotifications.rows) {
      const compositeKey = `${notif.post_id}-${notif.type}-${notif.read}`;

      if (!groupedMap.has(compositeKey)) {
        groupedMap.set(compositeKey, {
          type: notif.type,
          post_id: notif.post_id,
          post_title: notif.post_title,
          read: notif.read,
          created_at: notif.created_at,
          actor_count: 0,
          actor_usernames: [],
          actor_full_names: [],
          actor_avatars: [],
          comment_ids: [],
          comment_previews: [],
          latest_actor_username: notif.actor_username,
          latest_actor_full_name: notif.actor_full_name,
          latest_actor_avatar: notif.actor_avatar,
          latest_comment_id: notif.comment_id,
          latest_comment_preview: notif.comment_content?.substring(0, 100),
          notification_id: `${notif.post_id}-${notif.type}-${notif.read}-${notif.created_at.getTime()}`,
        });
      }

      const group = groupedMap.get(compositeKey);

      // Count unique actors
      if (!group.actor_usernames.includes(notif.actor_username)) {
        group.actor_count++;
        group.actor_usernames.push(notif.actor_username);
        group.actor_full_names.push(notif.actor_full_name);
        group.actor_avatars.push(notif.actor_avatar);
      }

      // Store comment IDs (for comment/reply types)
      if (
        (notif.type === "comment" ||
          notif.type === "reply" ||
          notif.type === "reply_on_post") &&
        notif.comment_id
      ) {
        if (!group.comment_ids.includes(notif.comment_id)) {
          group.comment_ids.push(notif.comment_id);
          if (notif.comment_content) {
            group.comment_previews.push(
              notif.comment_content.substring(0, 100),
            );
          }
        }
      }

      // Update latest if this notification is newer
      if (new Date(notif.created_at) > new Date(group.created_at)) {
        group.created_at = notif.created_at;
        group.latest_actor_username = notif.actor_username;
        group.latest_actor_full_name = notif.actor_full_name;
        group.latest_actor_avatar = notif.actor_avatar;
        group.read = notif.read;
        group.latest_comment_id = notif.comment_id;
        group.latest_comment_preview = notif.comment_content?.substring(0, 100);
      }
    }

    // Convert map to array and sort
    const results = Array.from(groupedMap.values());
    results.sort((a, b) => {
      if (a.read !== b.read) {
        return a.read === false ? -1 : 1;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return results;
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(DISTINCT CONCAT(post_id, '-', type)) as count
      FROM notifications
      WHERE user_id = $1 AND read = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // Mark all as read for a specific post
  static async markPostNotificationsAsRead(userId, postId, type = null) {
    let query;
    let values;

    if (type) {
      query = `
        UPDATE notifications 
        SET read = true 
        WHERE user_id = $1 AND post_id = $2 AND type = $3 AND read = false
      `;
      values = [userId, postId, type];
    } else {
      query = `
        UPDATE notifications 
        SET read = true 
        WHERE user_id = $1 AND post_id = $2 AND read = false
      `;
      values = [userId, postId];
    }

    await pool.query(query, values);
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

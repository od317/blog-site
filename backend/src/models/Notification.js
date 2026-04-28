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
    // First, get distinct groups by using a subquery approach
    // Get all unread notifications first to prioritize them
    const allNotificationsQuery = `
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
    ORDER BY n.read ASC, n.created_at DESC
    LIMIT $2 OFFSET $3
  `;

    const notificationsResult = await pool.query(allNotificationsQuery, [
      userId,
      limit * 2, // Fetch more to ensure we have enough after grouping
      offset,
    ]);

    if (notificationsResult.rows.length === 0) {
      return [];
    }

    // Group by composite key in JavaScript (post_id + type + read for posts, actor_id for follows)
    const groupedMap = new Map();

    for (const notif of notificationsResult.rows) {
      let groupKey;

      // For follow notifications, group by actor_id (since no post_id)
      if (notif.type === "follow") {
        groupKey = `follow-${notif.actor_id}-${notif.read}`;
      } else {
        // For post-related notifications, group by post_id and type and read
        groupKey = `${notif.post_id}-${notif.type}-${notif.read}`;
      }

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
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
          notification_id:
            notif.type === "follow"
              ? `follow-${notif.actor_id}-${notif.read}-${notif.created_at.getTime()}`
              : `${notif.post_id}-${notif.type}-${notif.read}-${notif.created_at.getTime()}`,
          actor_id: notif.actor_id,
        });
      }

      const group = groupedMap.get(groupKey);

      // Count unique actors (only for non-follow or add to follow groups)
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

    // Convert map to array and sort (unread first, then by date)
    const results = Array.from(groupedMap.values());
    results.sort((a, b) => {
      // Unread first (false before true)
      if (a.read !== b.read) {
        return a.read === false ? -1 : 1;
      }
      // Then by date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // Apply limit after grouping
    return results.slice(0, limit);
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

  // Mark follow notifications as read for a specific actor
  static async markFollowNotificationsAsRead(userId, actorId) {
    const query = `
    UPDATE notifications 
    SET read = true 
    WHERE user_id = $1 AND actor_id = $2 AND type = 'follow' AND read = false
  `;
    await pool.query(query, [userId, actorId]);
  }

  // Delete notification by post_id and actor_id
  static async deleteByPostAndActor(postId, actorId) {
    const query = `
      DELETE FROM notifications 
      WHERE post_id = $1 AND actor_id = $2 AND type = 'like'
      RETURNING id
    `;
    const result = await pool.query(query, [postId, actorId]);
    console.log(`🗑️ Deleted ${result.rowCount} like notifications`);
    return result.rows;
  }

  // Delete notification by post_id and actor_id for comments
static async deleteByPostAndComment(postId, actorId, type, commentId = null) {
  let query;
  let values;
  
  if (commentId) {
    // Delete specific reply notification
    query = `
      DELETE FROM notifications 
      WHERE post_id = $1 AND actor_id = $2 AND type = $3 AND comment_id = $4
      RETURNING id
    `;
    values = [postId, actorId, type, commentId];
  } else {
    // Delete all comment notifications for this actor on this post
    query = `
      DELETE FROM notifications 
      WHERE post_id = $1 AND actor_id = $2 AND type = $3
      RETURNING id
    `;
    values = [postId, actorId, type];
  }
  
  const result = await pool.query(query, values);
  console.log(`🗑️ Deleted ${result.rowCount} comment/notification(s)`);
  return result.rows;
}

static async deleteFollowNotification(userId, actorId) {
  const query = `
    DELETE FROM notifications 
    WHERE user_id = $1 AND actor_id = $2 AND type = 'follow'
    RETURNING id
  `;
  const result = await pool.query(query, [userId, actorId]);
  console.log(`🗑️ Deleted ${result.rowCount} follow notification(s)`);
  return result.rows;
}

}

module.exports = Notification;

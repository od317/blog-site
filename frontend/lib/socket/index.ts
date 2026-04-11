// Client management
export {
  initSocket,
  connectSocket,
  disconnectSocket,
  getSocket,
} from "./client";

// Events
export {
  onNewPost,
  onPostUpdated,
  onPostDeleted,
  onNewComment,
  onLikeUpdated,
  onFeedLikeUpdated,
  onAuthenticated,
  onSubscribed,
} from "./events";
export type { LikeData } from "../../types/Like";

// Rooms
export { joinPostRoom, leavePostRoom, unsubscribeFromFeed } from "./rooms";

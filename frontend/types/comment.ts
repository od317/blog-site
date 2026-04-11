import { Comment } from "./Post";

export interface AddCommentData {
  content: string;
}

export interface AddCommentResponse {
  success: boolean;
  comment: Comment;
  commentCount: number;
}

export interface DeleteCommentResponse {
  success: boolean;
  message: string;
  commentCount: number;
}

export interface GetCommentsResponse {
  comments: Comment[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

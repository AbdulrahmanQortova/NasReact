// src/services/postService.js
import { api } from './api';

class PostService {
  async getFeed(params = {}) {
    const {
      cursor = null,
      pageSize = 10,
      hashtagId = null,
      topicId = null,
    } = params;

    const queryParams = new URLSearchParams();
    if (cursor) queryParams.append('cursor', cursor);
    queryParams.append('pageSize', pageSize);
    if (hashtagId) queryParams.append('hashtagId', hashtagId);
    if (topicId) queryParams.append('topicId', topicId);

    return await api.get(`/posts/feed?${queryParams.toString()}`);
  }

  async getPostById(id) {
    return await api.get(`/posts/${id}`);
  }

  async createPost(data) {
    return await api.post('/posts', data, true);
  }

  async updatePost(id, data) {
    // ✅ Pass true for FormData
    return await api.put(`/posts/${id}`, data, true);
  }

  async deletePost(id) {
    return await api.delete(`/posts/${id}`);
  }

  async addComment(postId, data) {
    return await api.post(`/posts/${postId}/comments`, data);
  }

  async getComments(postId, page = 1, pageSize = 20) {
    return await api.get(`/posts/${postId}/comments?page=${page}&pageSize=${pageSize}`);
  }

  async toggleLike(postId) {
    return await api.post(`/posts/${postId}/likes`, {});
  }

  async toggleLikeComment(commentId) {
    return await api.post(`/posts/comments/${commentId}/likes`, {});
  }

  async deleteComment(commentId) {
    return await api.delete(`/posts/comments/${commentId}`);
  }

  async getCommentReplies(commentId, page = 1, pageSize = 20) {
    return await api.get(`/posts/comments/${commentId}/replies?page=${page}&pageSize=${pageSize}`);
  }

  async getPostLikes(postId, params = {}) {
    const { cursor = null, pageSize = 20 } = params;
    const queryParams = new URLSearchParams();
    if (cursor) queryParams.append('cursor', cursor);
    queryParams.append('pageSize', pageSize);
    return await api.get(`/posts/${postId}/likes?${queryParams.toString()}`);
  }

  async getHashtags(query = '') {
    return await api.get(`/posts/hashtags?q=${encodeURIComponent(query)}`);
  }

  async reportPost(postId, data) {
    return await api.post(`/posts/${postId}/report`, data);
  }
  async updateComment(commentId, data) {
  return await api.put(`/posts/comments/${commentId}`, data);
}
}

export const postService = new PostService();
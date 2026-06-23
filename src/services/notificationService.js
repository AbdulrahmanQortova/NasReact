// src/services/notificationService.js
import { api } from './api';

class NotificationService {
  async getNotifications(page = 1, pageSize = 20) {
    return await api.get(`/notifications?page=${page}&pageSize=${pageSize}`);
  }

  async markAsRead(id) {
    return await api.post(`/notifications/${id}/read`, {});
  }

  async markAllAsRead() {
    return await api.post('/notifications/read/all', {});
  }

  async deleteNotification(id) {
    return await api.delete(`/notifications/${id}`);
  }

  async deleteAll() {
    return await api.delete('/notifications/all');
  }
}

export const notificationService = new NotificationService();
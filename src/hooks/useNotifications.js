// src/hooks/useNotifications.js
import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { notificationService } from '../services/notificationService';
import { authService } from '../services/authService';

const HUB_URL = (import.meta.env.VITE_API_URL || 'https://localhost:7021/api')
  .replace('/api', '') + '/hubs/notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const connectionRef = useRef(null);
  const isLoggedIn = authService.isAuthenticated();

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const response = await notificationService.getNotifications(1, 20);
      const items = response.items || response.data || response || [];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const token = localStorage.getItem('auth_token');

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    connection.start()
      .then(() => console.log('✅ SignalR connected'))
      .catch(err => console.error('SignalR connection error:', err));

    connectionRef.current = connection;
    fetchNotifications();

    return () => { connection.stop(); };
  }, [isLoggedIn]);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        setUnreadCount(updated.filter(n => !n.isRead).length);
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  const deleteAll = useCallback(async () => {
    try {
      await notificationService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to delete all:', error);
    }
  }, []);

  // لما تضغط على الأيقونة تصفر العداد
  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    refetch: fetchNotifications,
    clearUnreadCount,
  };
}
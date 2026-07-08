// src/components/notifications/NotificationDropdown.jsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell, faHeart, faComment, faReply, faTrash, faCheck, faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import './NotificationDropdown.css';

const getNotificationIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'like':    return { icon: faHeart,   color: '#ff4757' };
    case 'comment': return { icon: faComment, color: 'var(--primary)' };
    case 'reply':   return { icon: faReply,   color: 'var(--purple)' };
    default:        return { icon: faBell,    color: 'var(--muted)' };
  }
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const normalized = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(normalized);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);

  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days < 7)     return `${days}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

export default function NotificationDropdown({
  isOpen, onClose, notifications, unreadCount, loading,
  onMarkAsRead, onMarkAllAsRead, onDelete, onDeleteAll,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen) return null;

const handleNotifClick = async (notif) => {
  if (!notif.isRead) await onMarkAsRead(notif.id);

  const postId = notif.relatedEntityId;
  const entityType = notif.relatedEntityType?.toLowerCase();

  if (postId) {
   

    navigate(`/community/post/${postId}`);
    onClose();
  }
};
  return (
    <div className="notif-dropdown">
      <div className="notif-header">
        <span className="notif-title">
          Notifications
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </span>
        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button className="notif-action-btn" onClick={onMarkAllAsRead} title="Mark all as read">
              <FontAwesomeIcon icon={faCheckDouble} />
            </button>
          )}
          {notifications.length > 0 && (
            <button className="notif-action-btn delete" onClick={onDeleteAll} title="Clear all">
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      </div>

      <div className="notif-list">
        {loading && notifications.length === 0 ? (
          <div className="notif-loading"><div className="notif-spinner"></div></div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <FontAwesomeIcon icon={faBell} className="notif-empty-icon" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const { icon, color } = getNotificationIcon(notif.type);
            return (
              <div
                key={notif.id}
                className={`notif-item ${!notif.isRead ? 'unread' : 'read'}`}
                onClick={() => handleNotifClick(notif)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notif-icon-wrap" style={{ color }}>
                  <FontAwesomeIcon icon={icon} />
                </div>
                <div className="notif-content">
                  <p className="notif-text">{notif.body || notif.title}</p>
                  <span className="notif-time">{formatTime(notif.createdAt)}</span>
                </div>
                <div className="notif-item-actions">
                  {!notif.isRead && (
                    <button
                      className="notif-read-btn"
                      onClick={(e) => { e.stopPropagation(); onMarkAsRead(notif.id); }}
                      title="Mark as read"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                  )}
                  <button
                    className="notif-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
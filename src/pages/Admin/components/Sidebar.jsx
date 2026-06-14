// src/pages/Admin/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../../services/authService';
import rightArrow from '../../../assets/images/rightarrow.png';
import leftArrow from '../../../assets/images/leftarrow.png';
import './Sidebar.css';

export default function Sidebar({ activeTab, onTabChange }) {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const menuItems = [
    { id: 'courses', label: t('admin.sidebar.courses'), icon: '📚', description: t('admin.sidebar.coursesDesc') },
    { id: 'topics', label: t('admin.sidebar.topics'), icon: '🏷️', description: t('admin.sidebar.topicsDesc') },
    { id: 'users', label: t('admin.sidebar.users'), icon: '👥', description: t('admin.sidebar.usersDesc') },
    { id: 'reports', label: t('admin.sidebar.reports'), icon: '📊', description: t('admin.sidebar.reportsDesc') },
    { id: 'settings', label: t('admin.sidebar.settings'), icon: '⚙️', description: t('admin.sidebar.settingsDesc') },
  ];

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return 'A';
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return t('admin.sidebar.admin');
  };

  // تحديد اتجاه السهم حسب اللغة وحالة التصغير
  const getArrowIcon = () => {
    if (collapsed) {
      // إذا كان مصغر، السهم يشير للخارج (توسيع)
      return isRTL ? leftArrow : rightArrow;
    } else {
      // إذا كان مفتوح، السهم يشير للداخل (تصغير)
      return isRTL ? rightArrow : leftArrow;
    }
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sidebar-header">
        {/* اللوجو يظهر فقط عندما يكون السايد بار مفتوح */}
        {!collapsed && (
          <div className="sidebar-logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">{t('admin.sidebar.adminPanel')}</span>
          </div>
        )}
        <button 
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
        >
          <img src={getArrowIcon()} alt="arrow" className="toggle-icon" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && (
              <div className="sidebar-text">
                <span className="sidebar-label">{item.label}</span>
                <span className="sidebar-description">{item.description}</span>
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar-small">
            {getInitials()}
          </div>
          {!collapsed && (
            <div className="user-info-small">
              <span className="user-name">{getUserName()}</span>
              <span className="user-role">{t('admin.sidebar.administrator')}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
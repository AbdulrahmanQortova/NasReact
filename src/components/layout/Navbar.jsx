import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from '../notifications/NotificationDropdown';
import './Navbar.css';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const notifBtnRef = useRef(null);

  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, deleteNotification, deleteAll, clearUnreadCount,
  } = useNotifications();

  const languages = [
    { code: 'en', name: 'English', dir: 'ltr', icon: '🇬🇧' },
    { code: 'ar', name: 'العربية', dir: 'rtl', icon: '🇸🇦' },
  ];

  const currentLanguage = i18n.language;

  // ── Close all dropdowns ──────────────────────────────────────
  const closeAll = () => {
    setShowUserMenu(false);
    setShowLanguageMenu(false);
    setShowNotifications(false);
  };

  const toggleMenu = (menu) => {
    const isOpen = { user: showUserMenu, language: showLanguageMenu, notif: showNotifications }[menu];
    closeAll();
    if (!isOpen) {
      if (menu === 'user')     setShowUserMenu(true);
      if (menu === 'language') setShowLanguageMenu(true);
      if (menu === 'notif')    setShowNotifications(true);
    }
  };

  // ── Theme ────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // ── Language ─────────────────────────────────────────────────
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    const lang = languages.find(l => l.code === langCode);
    document.documentElement.dir = lang?.dir || 'ltr';
    document.documentElement.lang = langCode;
    setShowLanguageMenu(false);
  };

  // ── Auth ─────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = () => {
      try {
        setIsLoggedIn(authService.isAuthenticated());
        setUser(authService.getCurrentUser());
      } catch {
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
    window.addEventListener('storage',    checkAuth);
    window.addEventListener('auth:login',  checkAuth);
    window.addEventListener('auth:logout', checkAuth);
    return () => {
      window.removeEventListener('storage',    checkAuth);
      window.removeEventListener('auth:login',  checkAuth);
      window.removeEventListener('auth:logout', checkAuth);
    };
  }, []);

  // ── Sync search query from URL ───────────────────────────────
  useEffect(() => {
    if (location.pathname === '/courses') {
      const params = new URLSearchParams(location.search);
      setSearchQuery(params.get('search') || '');
    }
  }, [location]);

  // ── Search ───────────────────────────────────────────────────
  const debounce = (func, delay) => {
    let id;
    return (...args) => { clearTimeout(id); id = setTimeout(() => func(...args), delay); };
  };

  const performSearch = useCallback((query) => {
    if (query.trim()) navigate(`/courses?search=${encodeURIComponent(query.trim())}`);
    else navigate('/courses');
  }, [navigate]);

  const debouncedSearch = useCallback(debounce(performSearch, 500), [performSearch]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  const clearSearch = () => { setSearchQuery(''); navigate('/courses'); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) performSearch(searchQuery);
  };

  // ── Logout ───────────────────────────────────────────────────
  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  // ── Helpers ──────────────────────────────────────────────────
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role || user.userRole === role || user.roles?.includes(role);
  };

  const isAdmin = () => {
    if (!user) return false;
    return user.role === 'Admin' || user.userRole === 'Admin' || user.roles?.includes('Admin');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // ── Nav links ────────────────────────────────────────────────
  const getNavLinks = () => {
    const links = [{ path: '/', label: t('nav.home') }];
    links.push({ path: '/courses', label: t('nav.courses') });
    if (isLoggedIn) {
      links.push({ path: '/community', label: t('nav.community') });
      if (hasRole('Student')) links.push({ path: '/exams', label: t('nav.exams') });
      if (isAdmin()) links.push({ path: '/admin/dashboard', label: t('nav.adminDashboard'), isAdmin: true });
      links.push({ path: '/dashboard', label: t('nav.dashboard') });
    }
    return links;
  };

  const navLinks = getNavLinks();
  const showSearch = ['/', '/courses'].includes(location.pathname) || location.pathname.startsWith('/courses');

  // ── Avatar URL ───────────────────────────────────────────────
  const getAvatarSrc = () => {
    if (!user?.profilePictureUrl) return null;
    if (user.profilePictureUrl.startsWith('http')) return user.profilePictureUrl;
    const base = (import.meta.env.VITE_API_URL || 'https://localhost:7021/api').replace('/api', '');
    return `${base}${user.profilePictureUrl}`;
  };

  const avatarSrc = getAvatarSrc();

  // ── Render ───────────────────────────────────────────────────
  return (
    <nav className="top-nav">

      {/* Brand */}
      <button className="brand-btn" onClick={() => navigate('/')}>
        <span className="brand-icon">🎓</span>
        <span>Nas Academy</span>
      </button>

      {/* Nav links */}
      <div className="nav-links">
        {navLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`${link.isAdmin ? 'admin-nav-link' : ''} ${isActive(link.path) ? 'active-link' : ''}`}
          >
            <button role="menuitem">{link.label}</button>
          </Link>
        ))}
      </div>

      {/* Search — only on / and /courses */}
      {showSearch && (
        <div className="nav-search-wrap">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder={t('nav.search')}
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={clearSearch} aria-label="Clear search">✕</button>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="nav-actions">

        {/* Theme toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {isDarkMode ? (
            <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Language */}
        <div className="language-dropdown">
          <button className="ghost-btn lang-btn" onClick={() => toggleMenu('language')}>
            {languages.find(l => l.code === currentLanguage)?.icon || '🌐'}{' '}
            {currentLanguage === 'ar' ? 'عربي' : 'English'}
          </button>
          {showLanguageMenu && (
            <div className="language-menu">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={currentLanguage === lang.code ? 'active' : ''}
                >
                  <span>{lang.icon}</span>{lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoggedIn ? (
          <>
            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifBtnRef}>
              <button
                className="icon-btn"
                onClick={() => {
                  const wasOpen = showNotifications;
                  toggleMenu('notif');
                  if (!wasOpen) clearUnreadCount();
                }}
                aria-label="Notifications"
              >
                <FontAwesomeIcon icon={faBell} />
                {unreadCount > 0 && (
                  <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                loading={loading}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onDeleteAll={deleteAll}
              />
            </div>

            {/* User menu */}
            <div className="user-menu">
              <button className="user-menu-btn" onClick={() => toggleMenu('user')}>
                <div className="user-avatar">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
                  )}
                </div>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <strong>{user?.firstName} {user?.lastName}</strong>
                    <small>{user?.email}</small>
                  </div>
                  <hr />
                  <button onClick={() => { closeAll(); navigate('/profile'); }}>{t('nav.profile')}</button>
                  <button onClick={() => { closeAll(); navigate('/settings'); }}>{t('nav.settings')}</button>
                  <hr />
                  <button onClick={handleLogout} className="logout-btn">{t('nav.logout')}</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="ghost-btn" onClick={() => navigate('/login')}>{t('nav.login')}</button>
            <button className="primary-btn" onClick={() => navigate('/register')}>{t('nav.signup')}</button>
          </>
        )}

        <button className="hamburger-btn" onClick={() => setShowMobileMenu(prev => !prev)}>☰</button>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`${link.isAdmin ? 'admin-nav-link' : ''} ${isActive(link.path) ? 'active-link' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              {link.label}
            </Link>
          ))}
          {!isLoggedIn && (
            <>
              <Link to="/login"    onClick={() => setShowMobileMenu(false)}>{t('nav.login')}</Link>
              <Link to="/register" onClick={() => setShowMobileMenu(false)}>{t('nav.signup')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
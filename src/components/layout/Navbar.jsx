// src/components/layout/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import './Navbar.css';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Languages list
  const languages = [
    { code: 'en', name: 'English', dir: 'ltr', icon: '🇬🇧' },
    { code: 'ar', name: 'العربية', dir: 'rtl', icon: '🇸🇦' }
  ];

  const currentLanguage = i18n.language;

  // Change language function
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    const lang = languages.find(l => l.code === langCode);
    document.documentElement.dir = lang?.dir || 'ltr';
    document.documentElement.lang = langCode;
    setShowLanguageMenu(false);
  };

  // Debounce function for search
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedIn = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();
        setIsLoggedIn(loggedIn);
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Read search query from URL when on courses page
  useEffect(() => {
    if (location.pathname === '/courses') {
      const params = new URLSearchParams(location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      } else {
        setSearchQuery('');
      }
    }
  }, [location]);

  // Perform search navigation
  const performSearch = useCallback((query) => {
    if (query.trim()) {
      navigate(`/courses?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/courses');
    }
  }, [navigate]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      performSearch(query);
    }, 500),
    [performSearch]
  );

  // Handle input change - search on typing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Handle clear search
  const clearSearch = () => {
    setSearchQuery('');
    navigate('/courses');
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role || user.userRole === role || user.roles?.includes(role);
  };

  const isAdmin = () => {
    if (!user) return false;
    return user.role === 'Admin' || user.userRole === 'Admin' || user.roles?.includes('Admin');
  };

  // ✅ Check if link is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getNavLinks = () => {
    const links = [
      { path: '/', label: t('nav.home'), icon: '🏠' }
    ];
    
    links.push({ path: '/courses', label: t('nav.courses'), icon: '📚' });
    
    if (isLoggedIn) {
      links.push({ path: '/live', label: t('nav.live'), icon: '📺' });
      links.push({ path: '/community', label: t('nav.community'), icon: '💬' });
      if (hasRole('Student')) {
        links.push({ path: '/exams', label: t('nav.exams'), icon: '📝' });
      }
      if (isAdmin()) {
        links.push({ path: '/admin/dashboard', label: t('nav.adminDashboard'), icon: '⚙️', isAdmin: true });
      }
      links.push({ path: '/dashboard', label: t('nav.dashboard'), icon: '📊' });
    }
    return links;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="top-nav">
      <button className="brand-btn" onClick={() => navigate('/')}>
        <span className="brand-icon">🎓</span>
        <span>Nas Academy</span>
      </button>

      <div className="nav-links">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path} 
            className={`${link.isAdmin ? 'admin-nav-link' : ''} ${isActive(link.path) ? 'active-link' : ''}`}
          >
            <button role="menuitem">
              {link.icon && <span className="link-icon">{link.icon}</span>}
              {link.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Search Box */}
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
            <button className="search-clear-btn" onClick={clearSearch} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="nav-actions">
        {/* Language Switcher */}
        <div className="language-dropdown">
          <button 
            className="ghost-btn lang-btn" 
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            {languages.find(l => l.code === currentLanguage)?.icon || '🌐'} {currentLanguage === 'ar' ? 'عربي' : 'English'}
          </button>
          {showLanguageMenu && (
            <div className="language-menu">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={currentLanguage === lang.code ? 'active' : ''}
                >
                  <span>{lang.icon}</span>
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {isLoggedIn ? (
          <>
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">✉️</button>
            <div className="user-menu">
              <button className="user-menu-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
                </div>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <strong>{user?.firstName} {user?.lastName}</strong>
                    <small>{user?.email}</small>
                  </div>
                  <hr />
                  <button onClick={() => navigate('/profile')}>{t('nav.profile')}</button>
                  <button onClick={() => navigate('/settings')}>{t('nav.settings')}</button>
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

        <button className="hamburger-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>☰</button>
      </div>

      {showMobileMenu && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
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
              <Link to="/login" onClick={() => setShowMobileMenu(false)}>{t('nav.login')}</Link>
              <Link to="/register" onClick={() => setShowMobileMenu(false)}>{t('nav.signup')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
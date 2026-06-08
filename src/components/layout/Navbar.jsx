// src/components/layout/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import './Navbar.css';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount and when route changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        // التحقق من وجود authService والوظائف
        if (!authService || typeof authService.isAuthenticated !== 'function') {
          console.error('authService.isAuthenticated is not a function');
          setIsLoggedIn(false);
          setUser(null);
          return;
        }
        
        const loggedIn = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();
        
        console.log('=== Navbar Debug ===');
        console.log('Is logged in:', loggedIn);
        console.log('Current user:', currentUser);
        console.log('Is admin?', authService.isAdmin?.());
        console.log('===================');
        
        setIsLoggedIn(loggedIn);
        setUser(currentUser);
        
        // If token expired, redirect to login
        if (!loggedIn && location.pathname !== '/login' && location.pathname !== '/register') {
          if (location.pathname !== '/' && !location.pathname.startsWith('/courses')) {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuth();
    
    // Listen for storage changes (logout in other tabs)
    window.addEventListener('storage', checkAuth);
    
    return () => window.removeEventListener('storage', checkAuth);
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    try {
      authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    setIsLoggedIn(false);
    setUser(null);
    setShowUserMenu(false);
    navigate('/courses');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  // Check user roles
  const hasRole = (role) => {
    if (!user) return false;
    if (!authService.hasRole) return user.role === role;
    return authService.hasRole(role);
  };

  const isAdmin = () => {
    if (!user) return false;
    if (authService.isAdmin) return authService.isAdmin();
    return user.role === 'Admin' || user.userRole === 'Admin';
  };

  // Determine which nav items to show based on roles
  const getNavLinks = () => {
    const links = [
      { path: '/courses', label: 'Courses', roles: ['all'] },
    ];

    if (isLoggedIn) {
      links.push(
        { path: '/live', label: 'Live', roles: ['all-logged-in'] },
        { path: '/community', label: 'Community', roles: ['all-logged-in'] }
      );

      if (hasRole('Student')) {
        links.push({ path: '/exams', label: 'Exams', roles: ['Student'] });
      }

      if (isAdmin()) {
        links.push({ 
          path: '/admin/dashboard', 
          label: '⚙️ Admin Dashboard', 
          roles: ['Admin'],
          isAdmin: true 
        });
      }

      links.push({ path: '/dashboard', label: 'Dashboard', roles: ['all-logged-in'] });
    }

    return links;
  };

  const navLinks = getNavLinks();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  return (
    <nav className="top-nav" role="navigation" aria-label="Main navigation">
      <button className="brand-btn" onClick={() => navigate('/courses')} aria-label="Nas Academy Courses">
        <span className="brand-icon" aria-hidden="true">NA</span>
        <span>Nas Academy</span>
      </button>

      <div className="nav-links" role="menubar">
        {navLinks.map((link) => (
          <Link key={link.path} to={link.path} className={link.isAdmin ? 'admin-nav-link' : ''}>
            <button role="menuitem">{link.label}</button>
          </Link>
        ))}
      </div>

      <div className="nav-search-wrap" role="search">
        <input
          type="search"
          placeholder="🔍 Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          aria-label="Search courses"
        />
      </div>

      <div className="nav-actions">
        <button className="ghost-btn" aria-label="Toggle language">
          العربية
        </button>
        
        {isLoggedIn ? (
          <>
            <button className="icon-btn" aria-label="Notifications">
              🔔
              {user?.hasUnreadNotifications && (
                <strong className="notification-badge">3</strong>
              )}
            </button>
            
            <button className="icon-btn" aria-label="Inbox">
              ✉️
            </button>

            <div className="user-menu">
              <button 
                className="user-menu-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                aria-label="User menu"
              >
                <div className="user-avatar">
                  {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt={`${user.firstName} ${user.lastName}`} />
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
                    <span className={`user-role ${isAdmin() ? 'admin-role' : 'student-role'}`}>
                      {isAdmin() ? '👑 Administrator' : '🎓 Student'}
                    </span>
                  </div>
                  <hr />
                  <button onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}>Profile</button>
                  <button onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}>Settings</button>
                  <hr />
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="ghost-btn" onClick={handleLoginClick}>
              Login
            </button>
            <button className="primary-btn" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </>
        )}

        <button 
          className="icon-btn hamburger-btn" 
          aria-label="Open menu" 
          aria-expanded={showMobileMenu}
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          ☰
        </button>
      </div>

      {showMobileMenu && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={link.isAdmin ? 'admin-nav-link' : ''}
              onClick={() => setShowMobileMenu(false)}
            >
              {link.label}
            </Link>
          ))}
          {!isLoggedIn && (
            <>
              <Link to="/login" onClick={() => setShowMobileMenu(false)}>Login</Link>
              <Link to="/register" onClick={() => setShowMobileMenu(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
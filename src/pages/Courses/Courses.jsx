// src/pages/Courses/Courses.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../services/courseService';
import { authService } from '../../services/authService';
import CourseCard from './components/CourseCard';
import RatingModal from './components/RatingModal';
import './Courses.css';

export default function Courses() {
  const { t, i18n } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    totalPages: 1,
    totalCount: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    topicId: '',
    sortBy: 'createdAt',
    ascending: false,
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = authService.isAuthenticated();
  const isRTL = i18n.language === 'ar';

  // Read search from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search') || '';
    if (searchQuery !== filters.search) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
    }
  }, [location.search]);

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  // Fetch courses when filters or page changes
  useEffect(() => {
    fetchCourses();
  }, [pagination.page, filters.search, filters.topicId, filters.sortBy, filters.ascending]);

  const fetchTopics = async () => {
    try {
      const response = await courseService.getAllTopics();
      const topicsData = response.data || response || [];
      setTopics(topicsData);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await courseService.getAll({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: filters.search,
        topicId: filters.topicId,
        sortBy: filters.sortBy,
        ascending: filters.ascending,
      });
      
      const coursesData = response.items || response.data || [];
      
      if (isLoggedIn) {
        const enrollments = await fetchUserEnrollments();
        coursesData.forEach(course => {
          course.isEnrolled = enrollments.some(e => e.courseId === course.id);
        });
      }
      
      setCourses(coursesData);
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages || 1,
        totalCount: response.totalCount || 0,
      }));
    } catch (err) {
      setError(err.message || t('courses.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEnrollments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://localhost:7021/api/Enrollments/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) return await response.json();
      return [];
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      return [];
    }
  };

  const handleEnroll = async (courseId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://localhost:7021/api/Enrollments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });
      
      if (response.ok) {
        alert(t('courses.enrollSuccess') || 'Successfully enrolled!');
        setCourses(prev => prev.map(c => 
          c.id === courseId ? { ...c, isEnrolled: true } : c
        ));
      } else {
        const error = await response.json();
        alert(error.message || t('courses.enrollFailed'));
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert(t('courses.enrollFailed'));
    }
  };

  const handleTopicFilter = (topicId) => {
    setFilters(prev => ({ ...prev, topicId }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (e) => {
    const [sortBy, ascending] = e.target.value.split('|');
    setFilters(prev => ({
      ...prev,
      sortBy,
      ascending: ascending === 'true',
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRateClick = (course) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setSelectedCourse(course);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      await courseService.rateCourse(selectedCourse.id, ratingData);
      await fetchCourses();
      setShowRatingModal(false);
      setSelectedCourse(null);
    } catch (err) {
      setError(err.message || t('courses.rateFailed'));
    }
  };

  const handleViewCourse = (course) => {
    navigate(`/courses/${course.id}`);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', topicId: '', sortBy: 'createdAt', ascending: false });
    setPagination(prev => ({ ...prev, page: 1 }));
    navigate('/courses', { replace: true });
  };

  const getTopicName = (topicId) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || t('courses.uncategorized');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.topicId) count++;
    return count;
  };

  if (loading && courses.length === 0) {
    return (
      <div className="courses-loading">
        <div className="spinner"></div>
        <p>{t('courses.loading')}</p>
      </div>
    );
  }

  return (
    <div className="courses-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className="courses-hero-animated">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        <div className="hero-content-animated">
          <div className="hero-badge">
            <span className="badge-icon">🎓</span>
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="hero-title">
            {t('hero.title')}
            <span className="gradient-text"> {t('hero.titleGradient')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('hero.subtitle')}
          </p>
          <div className="hero-stats-animated">
            <div className="hero-stat-item">
              <div className="stat-number">{pagination.totalCount || courses.length}+</div>
              <div className="stat-label">{t('hero.courses')}</div>
            </div>
            <div className="hero-stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">{t('hero.students')}</div>
            </div>
            <div className="hero-stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">{t('hero.instructors')}</div>
            </div>
            <div className="hero-stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">{t('hero.satisfaction')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar - Horizontal */}
      <div className="categories-bar">
        <div className="categories-container">
          <button
            className={`category-chip ${!filters.topicId ? 'active' : ''}`}
            onClick={() => handleTopicFilter('')}
          >
            {t('courses.all')}
          </button>
          {topics.map(topic => (
            <button
              key={topic.id}
              className={`category-chip ${filters.topicId === topic.id ? 'active' : ''}`}
              onClick={() => handleTopicFilter(topic.id)}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results & Sort Bar */}
      <div className="results-sort-bar">
        <div className="results-info">
          <span className="results-count">{pagination.totalCount || courses.length}</span>
          <span className="results-label">{t('courses.coursesFound')}</span>
          {getActiveFiltersCount() > 0 && (
            <button className="clear-filters-small" onClick={handleClearFilters}>
              ✕ {t('courses.clearAll')}
            </button>
          )}
        </div>

        <div className="sort-section">
          <label className="sort-label">{t('courses.sortBy')}:</label>
          <div className="sort-dropdown-wrapper">
            <select 
              className="sort-dropdown"
              value={`${filters.sortBy}|${filters.ascending}`}
              onChange={handleSortChange}
            >
              <option value="createdAt|false">{t('courses.latest')}</option>
              <option value="createdAt|true">{t('courses.oldest')}</option>
              <option value="title|true">{t('courses.titleAsc')}</option>
              <option value="title|false">{t('courses.titleDesc')}</option>
              <option value="averageRating|false">{t('courses.highestRated')}</option>
              <option value="averageRating|true">{t('courses.lowestRated')}</option>
              <option value="durationInMinutes|true">{t('courses.shortest')}</option>
              <option value="durationInMinutes|false">{t('courses.longest')}</option>
              <option value="price|true">{t('courses.priceLow')}</option>
              <option value="price|false">{t('courses.priceHigh')}</option>
            </select>
            <span className="dropdown-arrow">▼</span>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(filters.topicId || filters.search) && (
        <div className="active-filters-bar">
          {filters.topicId && (
            <span className="active-filter-tag">
              {t('courses.category')}: {getTopicName(filters.topicId)}
              <button onClick={() => handleTopicFilter('')}>✕</button>
            </span>
          )}
          {filters.search && (
            <span className="active-filter-tag">
              {t('courses.search')}: {filters.search}
              <button onClick={() => {
                setFilters(prev => ({ ...prev, search: '' }));
                navigate('/courses', { replace: true });
              }}>✕</button>
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="courses-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button onClick={fetchCourses} className="retry-btn">{t('common.retry')}</button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && courses.length === 0 && !error ? (
        <div className="courses-empty">
          <div className="empty-icon">📚</div>
          <h3>{t('courses.noCourses')}</h3>
          <p>{t('courses.tryAdjusting')}</p>
          <button onClick={handleClearFilters} className="clear-filters-btn">
            {t('courses.clearFilters')}
          </button>
        </div>
      ) : (
        <>
          <div className="courses-grid">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                topicName={getTopicName(course.topicId)}
                onRate={handleRateClick}
                onView={handleViewCourse}
                onEnroll={handleEnroll}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="courses-pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="page-btn prev"
              >
                ← {t('common.previous')}
              </button>
              
              <div className="page-numbers">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`page-number ${pagination.page === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="page-btn next"
              >
                {t('common.next')} →
              </button>
            </div>
          )}
        </>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          course={selectedCourse}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedCourse(null);
          }}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
}
// src/pages/Courses/Courses.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../services/courseService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import CourseCard from './components/CourseCard';
import CourseSkeleton from './components/CourseSkeleton';
import RatingModal from './components/RatingModal';
import InfiniteScroll from '../../components/ui/InfiniteScroll';
import './Courses.css';

export default function Courses() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = authService.isAuthenticated();
  const isRTL = i18n.language === 'ar';
  
  // State
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(6);
  const [filters, setFilters] = useState({
    search: '',
    topicId: '',
    sortBy: 'createdAt',
    ascending: false,
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  // Refs
  const isFirstLoad = useRef(true);
  const isFetching = useRef(false);

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

  // Reset state when filters change
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    resetAndFetch();
  }, [filters.search, filters.topicId, filters.sortBy, filters.ascending]);

  const fetchTopics = async () => {
    try {
      const response = await courseService.getAllTopics();
      const topicsData = response.data || response || [];
      setTopics(topicsData);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const resetAndFetch = () => {
    setCourses([]);
    setPage(1);
    setHasMore(true);
    setTotalCount(0);
    setError('');
    isFetching.current = false;
    fetchCourses(true);
  };

const fetchCourses = async (reset = false) => {
  if (isFetching.current) return;
  if (!reset && !hasMore) return;

  isFetching.current = true;
  
  if (reset) {
    setInitialLoading(true);
  } else {
    setLoading(true);
  }

  try {
    const currentPage = reset ? 1 : page;
    
    console.log('🔍 Fetching courses - Page:', currentPage, 'PageSize:', pageSize);
    
    const response = await courseService.getAll({
      page: currentPage,
      pageSize: pageSize,
      search: filters.search,
      topicId: filters.topicId,
      sortBy: filters.sortBy,
      ascending: filters.ascending,
    });

    console.log('📦 Full API Response:', response);

    const items = response.data || [];
    const pagination = response.pagination || {};
    const totalItems = pagination.totalCount || 0;

    console.log('📊 Items received:', items.length);
    console.log('📊 Total items from pagination:', totalItems);
    console.log('📊 Pagination object:', pagination);
    console.log('📊 Current page:', currentPage);

    if (items.length === 0) {
      setHasMore(false);
      isFetching.current = false;
      setLoading(false);
      setInitialLoading(false);
      return;
    }

    // Get enrollments if user is logged in
    let enrollments = [];
    if (isLoggedIn) {
      try {
        const enrollResponse = await courseService.getMyEnrollments();
        enrollments = enrollResponse.data || enrollResponse || [];
      } catch (err) {
        console.error('Error fetching enrollments:', err);
      }
    }

    // Update enrollment status for each course
    const itemsWithEnrollment = items.map(course => ({
      ...course,
      isEnrolled: enrollments.some(e => e.courseId === course.id),
    }));

    // Update state based on reset flag
    if (reset) {
      setCourses(itemsWithEnrollment);
    } else {
      setCourses(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newItems = itemsWithEnrollment.filter(c => !existingIds.has(c.id));
        return [...prev, ...newItems];
      });
    }

    // Update pagination
    setTotalCount(totalItems);
    const totalPages = Math.ceil(totalItems / pageSize);
    const nextPage = currentPage + 1;
    
    setPage(nextPage);
    setHasMore(nextPage <= totalPages);
    
    console.log('✅ Total pages:', totalPages);
    console.log('✅ Next page:', nextPage);
    console.log('✅ HasMore:', nextPage <= totalPages);

    setError('');

  } catch (err) {
    console.error('❌ Error fetching courses:', err);
    setError(err.message || t('courses.error'));
    toast.error(err.message || t('courses.error'));
  } finally {
    isFetching.current = false;
    setInitialLoading(false);
    setLoading(false);
  }
};
  const loadMore = useCallback(() => {
    console.log('🔄 Load more triggered - loading:', loading, 'hasMore:', hasMore, 'isFetching:', isFetching.current);
    if (!loading && hasMore && !isFetching.current) {
      console.log('🔄 Calling fetchCourses for page:', page);
      fetchCourses(false);
    }
  }, [loading, hasMore, page]);

  // ... باقي الدوال (handleEnroll, handleUnenroll, etc.)

  const handleEnroll = async (courseId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    try {
      await courseService.enrollInCourse(courseId);
      setCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, isEnrolled: true } : c
      ));
      toast.success(t('courses.enrollSuccess'));
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error.message || t('courses.enrollFailed'));
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!window.confirm(t('courses.confirmUnenroll'))) return;
    
    try {
      await courseService.unenrollFromCourse(courseId);
      setCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, isEnrolled: false } : c
      ));
      toast.success(t('courses.unenrollSuccess'));
    } catch (error) {
      console.error('Unenroll error:', error);
      toast.error(error.message || t('courses.unenrollFailed'));
    }
  };

  const handleTopicFilter = (topicId) => {
    setFilters(prev => ({ ...prev, topicId }));
  };

  const handleSortChange = (e) => {
    const [sortBy, ascending] = e.target.value.split('|');
    setFilters(prev => ({
      ...prev,
      sortBy,
      ascending: ascending === 'true',
    }));
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
      resetAndFetch();
      setShowRatingModal(false);
      setSelectedCourse(null);
      toast.success(t('courses.rateSuccess'));
    } catch (err) {
      setError(err.message || t('courses.rateFailed'));
      toast.error(err.message || t('courses.rateFailed'));
    }
  };

  const handleViewCourse = (course) => {
    navigate(`/courses/${course.id}`);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', topicId: '', sortBy: 'createdAt', ascending: false });
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

  // Loading Skeleton
  if (initialLoading) {
    return (
      <div className="courses-page" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="categories-bar">
          <div className="categories-container">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="category-chip-skeleton"></div>
            ))}
          </div>
        </div>
        <div className="courses-grid skeleton">
          {[...Array(6)].map((_, i) => (
            <CourseSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Categories Bar */}
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
          <span className="results-count">{totalCount || courses.length}</span>
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
          <button onClick={resetAndFetch} className="retry-btn">{t('common.retry')}</button>
        </div>
      )}

      {/* Courses Grid with Infinite Scroll */}
      {courses.length === 0 && !error ? (
        <div className="courses-empty">
          <div className="empty-icon">📚</div>
          <h3>{t('courses.noCourses')}</h3>
          <p>{t('courses.tryAdjusting')}</p>
          <button onClick={handleClearFilters} className="clear-filters-btn">
            {t('courses.clearFilters')}
          </button>
        </div>
      ) : (
        <InfiniteScroll
          hasMore={hasMore}
          loading={loading}
          onLoadMore={loadMore}
          endMessage={<span>{t('courses.noMoreCourses')}</span>}
        >
          <div className="courses-grid">
            {courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                topicName={getTopicName(course.topicId)}
                onRate={handleRateClick}
                onView={handleViewCourse}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
                index={index}
              />
            ))}
          </div>
        </InfiniteScroll>
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
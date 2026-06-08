// src/pages/Courses/Courses.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { authService } from '../../services/authService';
import CourseCard from './components/CourseCard';
import RatingModal from './components/RatingModal';
import './Courses.css';

export default function Courses() {
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
  const isAdmin = authService.isAdmin();

  // Get search from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    if (searchQuery) {
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
      
      setCourses(response.items || response.data || []);
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages || 1,
        totalCount: response.totalCount || 0,
      }));
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCourses();
  };

  const handleTopicFilter = (topicId) => {
    setFilters(prev => ({ ...prev, topicId, page: 1 }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      ascending: prev.sortBy === sortBy ? !prev.ascending : true,
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
      setError(err.message || 'Failed to submit rating');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await courseService.delete(courseId);
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to delete course');
    }
  };

  const handleViewCourse = (course) => {
    navigate(`/courses/${course.id}`);
  };

  // Get topic name by ID
  const getTopicName = (topicId) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || 'Uncategorized';
  };

  if (loading && courses.length === 0) {
    return (
      <div className="courses-loading">
        <div className="spinner"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="courses-page">
      {/* Header */}
      <div className="courses-header">
        <h1>All Courses</h1>
        <p>Discover the best courses to advance your career</p>
      </div>

      {/* Filters Bar */}
      <div className="courses-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="search"
            placeholder="Search courses..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="search-input"
          />
          <button type="submit" className="search-btn">🔍 Search</button>
        </form>

        {/* Topics Dropdown */}
        <div className="topic-filter">
          <select 
            value={filters.topicId} 
            onChange={(e) => handleTopicFilter(e.target.value)}
            className="topic-select"
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.iconUrl ? `${topic.iconUrl.split('/').pop()} ` : '🏷️'} {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-buttons">
          <button 
            className={`sort-btn ${filters.sortBy === 'title' ? 'active' : ''}`}
            onClick={() => handleSort('title')}
          >
            Title {filters.sortBy === 'title' && (filters.ascending ? '↑' : '↓')}
          </button>
          <button 
            className={`sort-btn ${filters.sortBy === 'createdAt' ? 'active' : ''}`}
            onClick={() => handleSort('createdAt')}
          >
            Newest {filters.sortBy === 'createdAt' && (filters.ascending ? '↑' : '↓')}
          </button>
          <button 
            className={`sort-btn ${filters.sortBy === 'averageRating' ? 'active' : ''}`}
            onClick={() => handleSort('averageRating')}
          >
            Rating {filters.sortBy === 'averageRating' && (filters.ascending ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {filters.topicId && (
        <div className="active-filters">
          <span className="filter-badge">
            Topic: {getTopicName(filters.topicId)}
            <button onClick={() => handleTopicFilter('')}>✕</button>
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="courses-error">
          ⚠️ {error}
          <button onClick={fetchCourses}>Try Again</button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && courses.length === 0 && !error ? (
        <div className="courses-empty">
          <p>No courses found</p>
          <button onClick={() => {
            setFilters({ search: '', topicId: '', sortBy: 'createdAt', ascending: false });
            fetchCourses();
          }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              topicName={getTopicName(course.topicId)}
              onRate={handleRateClick}
              onDelete={handleDeleteCourse}
              onView={handleViewCourse}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="courses-pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="page-btn"
          >
            ← Previous
          </button>
          
          <span className="page-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="page-btn"
          >
            Next →
          </button>
        </div>
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
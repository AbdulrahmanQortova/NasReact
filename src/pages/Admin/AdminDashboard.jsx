// src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { courseService } from '../../services/courseService';
import CreateCourseModal from './components/CreateCourseModal';
import TopicsManager from './components/TopicsManager';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showTopicsManager, setShowTopicsManager] = useState(false);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalTopics: 0,
    totalStudents: 1250,
    totalRevenue: 45750,
  });
  const [activeTab, setActiveTab] = useState('courses');
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = authService.isAdmin();
    if (!isAdmin) {
      navigate('/courses');
    } else {
      fetchData();
    }
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCourses(), fetchTopics()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAll({ pageSize: 100 });
      const coursesData = response.items || response.data || [];
      setCourses(coursesData);
      setStats(prev => ({ ...prev, totalCourses: coursesData.length }));
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await courseService.getAllTopics();
      const topicsData = response.data || response || [];
      setTopics(topicsData);
      setStats(prev => ({ ...prev, totalTopics: topicsData.length }));
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await courseService.delete(courseId);
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? Related courses may be affected.')) return;
    
    try {
      await courseService.deleteTopic(topicId);
      await fetchTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  // دالة لتحويل رقم المستوى إلى نص
  const getLevelName = (level) => {
    const levelMap = {
      0: 'Beginner',
      1: 'Intermediate',
      2: 'Advanced'
    };
    return levelMap[level] || 'Beginner';
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {authService.getCurrentUser()?.firstName || 'Admin'}</p>
        </div>
        <div className="header-actions">
          <button 
            className="secondary-btn"
            onClick={() => setShowTopicsManager(true)}
          >
            📂 Manage Topics
          </button>
          <button 
            className="create-course-btn"
            onClick={() => setShowCreateCourseModal(true)}
          >
            + Create New Course
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{stats.totalCourses}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-info">
            <h3>{stats.totalTopics}</h3>
            <p>Total Topics</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-info">
            <h3>{stats.totalStudents.toLocaleString()}</h3>
            <p>Active Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>${stats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses
        </button>
        <button 
          className={`tab-btn ${activeTab === 'topics' ? 'active' : ''}`}
          onClick={() => setActiveTab('topics')}
        >
          🏷️ Topics
        </button>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="admin-courses-section">
          <div className="section-header">
            <h2>All Courses</h2>
            <button 
              className="secondary-btn"
              onClick={() => setShowCreateCourseModal(true)}
            >
              + Add Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state">
              <p>No courses yet. Create your first course!</p>
              <button 
                className="primary-btn"
                onClick={() => setShowCreateCourseModal(true)}
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className="courses-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Thumbnail</th>
                    <th>Title</th>
                    <th>Level</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => {
                    const levelName = getLevelName(course.level);
                    return (
                      <tr key={course.id}>
                        <td>
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.title} className="course-thumbnail" />
                          ) : (
                            <div className="thumbnail-placeholder">📚</div>
                          )}
                        </td>
                        <td>
                          <div className="course-title-cell">
                            <span>{course.title}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`level-badge level-${levelName.toLowerCase()}`}>
                            {levelName}
                          </span>
                        </td>
                        <td>{course.durationInMinutes} min</td>
                        <td>${course.price || 0}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="edit-btn"
                              onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div className="admin-topics-section">
          <div className="section-header">
            <h2>All Topics</h2>
            <button 
              className="secondary-btn"
              onClick={() => setShowTopicsManager(true)}
            >
              + Add Topic
            </button>
          </div>

          {topics.length === 0 ? (
            <div className="empty-state">
              <p>No topics yet. Create your first topic!</p>
              <button 
                className="primary-btn"
                onClick={() => setShowTopicsManager(true)}
              >
                Create Topic
              </button>
            </div>
          ) : (
            <div className="topics-grid">
              {topics.map(topic => (
                <div key={topic.id} className="topic-card">
                  <div className="topic-icon">
                    {topic.iconUrl ? (
                      <img src={topic.iconUrl} alt={topic.name} />
                    ) : (
                      <span>🏷️</span>
                    )}
                  </div>
                  <div className="topic-info">
                    <h3>{topic.name}</h3>
                    <p>{topic.description}</p>
                  </div>
                  <div className="topic-actions">
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteTopic(topic.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateCourseModal && (
        <CreateCourseModal
          onClose={() => setShowCreateCourseModal(false)}
          onSuccess={() => {
            fetchCourses();
            setShowCreateCourseModal(false);
          }}
        />
      )}

      {showTopicsManager && (
        <TopicsManager
          onClose={() => setShowTopicsManager(false)}
          onSuccess={() => {
            fetchTopics();
            setShowTopicsManager(false);
          }}
        />
      )}
    </div>
  );
}
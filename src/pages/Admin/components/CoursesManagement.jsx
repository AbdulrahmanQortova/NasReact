// src/pages/Admin/components/CoursesManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import CreateCourseModal from './CreateCourseModal';
import editIcon from '../../../assets/images/edit.png';
import deleteIcon from '../../../assets/images/delete.png';
import './CoursesManagement.css';

export default function CoursesManagement() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getAll({ pageSize: 100 });
      const coursesData = response.items || response.data || [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm(t('admin.courses.confirmDelete'))) return;
    try {
      await courseService.delete(courseId);
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(t('admin.courses.deleteFailed'));
    }
  };

  const handleManageSections = (course) => {
    navigate(`/admin/courses/${course.id}`);
  };

  const handleEditCourse = (courseId) => {
    navigate(`/admin/courses/${courseId}/edit`);
  };

  const getImageUrl = (thumbnailUrl) => {
    if (!thumbnailUrl) return null;
    if (thumbnailUrl.startsWith('/')) {
      return `https://localhost:7021${thumbnailUrl}`;
    }
    return thumbnailUrl;
  };

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return t('courses.free');
    if (numPrice <= 0) return t('courses.free');
    return `$${numPrice.toFixed(2)}`;
  };

  const getLevelName = (level) => {
    const levelMap = { 
      0: t('courses.level.beginner'), 
      1: t('courses.level.intermediate'), 
      2: t('courses.level.advanced') 
    };
    return levelMap[level] || t('courses.level.beginner');
  };

  const getLevelClass = (level) => {
    const levelMap = { 0: 'beginner', 1: 'intermediate', 2: 'advanced' };
    return levelMap[level] || 'beginner';
  };

  if (loading) {
    return <div className="management-loading">{t('admin.courses.loading')}</div>;
  }

  return (
    <div className="courses-management-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="management-header">
        <div className="header-info">
          <h2>{t('admin.courses.title')}</h2>
          <span className="course-count">{t('admin.courses.total', { count: courses.length })}</span>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          + {t('admin.courses.createNew')}
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin.courses.noCourses')}</p>
          <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
            {t('admin.courses.createFirst')}
          </button>
        </div>
      ) : (
        <div className="courses-cards-grid">
          {courses.map(course => (
            <div key={course.id} className="course-admin-card">
              {/* Card Image with overlay */}
              <div className="card-image-wrapper">
                {course.thumbnailUrl ? (
                  <img 
                    src={getImageUrl(course.thumbnailUrl)} 
                    alt={course.title} 
                    className="card-image"
                  />
                ) : (
                  <div className="card-image-placeholder">📚</div>
                )}
                <div className="image-overlay"></div>
                
                {/* Action Buttons - Circles */}
                <div className="card-actions">
                  <button 
                    className="action-circle edit-circle"
                    onClick={() => handleEditCourse(course.id)}
                    title={t('common.edit')}
                  >
                    <img src={editIcon} alt="edit" className="action-icon" />
                  </button>
                  <button 
                    className="action-circle delete-circle"
                    onClick={() => handleDeleteCourse(course.id)}
                    title={t('common.delete')}
                  >
                    <img src={deleteIcon} alt="delete" className="action-icon" />
                  </button>
                </div>
                
                {/* Level Badge */}
                <span className={`card-level-badge level-${getLevelClass(course.level)}`}>
                  {getLevelName(course.level)}
                </span>
              </div>

              {/* Card Content */}
              <div className="card-content">
                <h3 className="card-title">{course.title}</h3>
                <p className="card-description">
                  {course.description?.substring(0, 80)}
                  {course.description?.length > 80 ? '...' : ''}
                </p>
                
                <div className="card-meta">
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{course.durationInMinutes} {t('admin.courses.minutes')}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">💰</span>
                    <span className={course.price > 0 ? "price-value" : "price-free"}>
                      {formatPrice(course.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <button 
                className="sections-btn"
                onClick={() => handleManageSections(course)}
              >
                📋 {t('admin.courses.viewEditSections')}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchCourses();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
// src/pages/Admin/components/CoursesManagement.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import CreateCourseModal from './CreateCourseModal';
import './CoursesManagement.css';

export default function CoursesManagement() {
  const { t, i18n } = useTranslation();
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
    if (!window.confirm(t('admin.confirmDeleteCourse'))) return;
    try {
      await courseService.delete(courseId);
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(t('admin.deleteFailed'));
    }
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

  if (loading) {
    return <div className="management-loading">{t('admin.loadingCourses')}</div>;
  }

  return (
    <div className="management-container" dir={isRTL ? 'rtl' : 'ltr'}>
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
        <div className="courses-table-container">
          <table className="management-table">
            <thead>
              <tr>
                <th>{t('admin.courses.thumbnail')}</th>
                <th>{t('admin.courses.title')}</th>
                <th>{t('admin.courses.level')}</th>
                <th>{t('admin.courses.duration')}</th>
                <th>{t('admin.courses.price')}</th>
                <th>{t('admin.courses.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>
                    {course.thumbnailUrl ? (
                      <img src={getImageUrl(course.thumbnailUrl)} alt={course.title} className="table-thumbnail" />
                    ) : (
                      <div className="table-thumbnail-placeholder">📚</div>
                    )}
                  </td>
                  <td>{course.title}</td>
                  <td>
                    <span className={`level-badge level-${getLevelName(course.level).toLowerCase()}`}>
                      {getLevelName(course.level)}
                    </span>
                  </td>
                  <td>{course.durationInMinutes} {t('admin.courses.minutes')}</td>
                  <td>
                    <span className={course.price > 0 ? "price-value" : "price-free"}>
                      {formatPrice(course.price)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn">{t('admin.courses.edit')}</button>
                      <button className="delete-btn" onClick={() => handleDeleteCourse(course.id)}>
                        {t('admin.courses.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
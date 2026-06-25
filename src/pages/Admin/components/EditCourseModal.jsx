// src/pages/Admin/components/EditCourseModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import './EditCourseModal.css';

export default function EditCourseModal({ course, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'Beginner',
    durationInMinutes: 60,
    topicId: '',
    price: 0,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (course) {
      const levelMap = { 0: 'Beginner', 1: 'Intermediate', 2: 'Advanced' };
      setFormData({
        title: course.title || '',
        description: course.description || '',
        level: levelMap[course.level] || 'Beginner',
        durationInMinutes: course.durationInMinutes || 60,
        topicId: course.topicId || '',
        price: course.price || 0,
      });
      if (course.thumbnailUrl) {
        setThumbnailPreview(getImageUrl(course.thumbnailUrl));
      }
    }
    fetchTopics();
  }, [course]);

  const fetchTopics = async () => {
    try {
      const response = await courseService.getAllTopics();
      const topicsData = response.data || response || [];
      setTopics(topicsData);
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const getImageUrl = (thumbnailUrl) => {
    if (!thumbnailUrl) return null;
    if (thumbnailUrl.startsWith('/')) {
      return `https://localhost:7021${thumbnailUrl}`;
    }
    return thumbnailUrl;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setThumbnail(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError(t('admin.editCourse.titleRequired'));
      return;
    }
    
    if (!formData.topicId) {
      setError(t('admin.editCourse.topicRequired'));
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const levelNumber = {
        'Beginner': 0,
        'Intermediate': 1,
        'Advanced': 2
      };
      
      const courseData = {
        Title: formData.title.trim(),
        Description: formData.description.trim() || null,
        Level: levelNumber[formData.level],
        DurationInMinutes: parseInt(formData.durationInMinutes),
        TopicId: formData.topicId,
        Price: parseFloat(formData.price) || 0,
      };
      
      console.log('Updating course with data:', courseData);
      
      await courseService.update(course.id, courseData);
      
      if (thumbnail) {
        await courseService.uploadThumbnail(course.id, thumbnail);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Update course error:', err);
      setError(err.message || t('admin.editCourse.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-course-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>✏️ {t('admin.editCourse.title')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('admin.editCourse.courseTitle')} *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('admin.editCourse.titlePlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('admin.editCourse.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('admin.editCourse.descriptionPlaceholder')}
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('admin.editCourse.level')} *</label>
                <select name="level" value={formData.level} onChange={handleChange} required>
                  <option value="Beginner">🌱 {t('courses.level.beginner')}</option>
                  <option value="Intermediate">📘 {t('courses.level.intermediate')}</option>
                  <option value="Advanced">🚀 {t('courses.level.advanced')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('admin.editCourse.duration')} *</label>
                <input
                  type="number"
                  name="durationInMinutes"
                  value={formData.durationInMinutes}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('admin.editCourse.topic')} *</label>
                <select 
                  name="topicId" 
                  value={formData.topicId} 
                  onChange={handleChange}
                  disabled={loadingTopics}
                  required
                >
                  <option value="">{t('admin.editCourse.selectTopic')}</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('admin.editCourse.price')}</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('admin.editCourse.thumbnail')}</label>
              <div 
                className="thumbnail-upload" 
                onClick={() => document.getElementById('thumbnail-input').click()}
              >
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>📸</span>
                    <p>{t('admin.editCourse.clickToUpload')}</p>
                    <small>{t('admin.editCourse.imageHint')}</small>
                  </div>
                )}
                <input
                  id="thumbnail-input"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  style={{ display: 'none' }}
                />
              </div>
              {thumbnailPreview && (
                <button 
                  type="button"
                  className="remove-thumbnail-btn"
                  onClick={() => {
                    setThumbnail(null);
                    setThumbnailPreview(null);
                  }}
                >
                  {t('common.remove')}
                </button>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? t('common.saving') : t('common.update')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
// src/pages/Admin/components/CreateCourseModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import { useToast } from '../../../context/ToastContext';
import './CreateCourseModal.css';

export default function CreateCourseModal({ onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
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
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await courseService.getAllTopics();
      const topicsData = response.data || response || [];
      setTopics(topicsData);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(t('admin.courses.topicsLoadError'));
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('admin.courses.imageSizeError'));
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(t('admin.courses.imageTypeError'));
        return;
      }
      
      setThumbnail(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      setError('');
    }
  };

  const uploadThumbnail = async (courseId) => {
    if (!thumbnail) return null;
    
    try {
      const formData = new FormData();
      formData.append('file', thumbnail);
      
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`https://localhost:7021/api/Courses/${courseId}/thumbnail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('admin.courses.uploadFailed'));
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError(t('admin.courses.titleRequired'));
      return;
    }
    
    if (!formData.topicId) {
      setError(t('admin.courses.topicRequired'));
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
      
      const course = await courseService.create(courseData);
      
      if (thumbnail && course.id) {
        await uploadThumbnail(course.id);
      }
      
      toast.success(t('admin.courses.createSuccess'));
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create course error:', err);
      setError(err.message || t('admin.courses.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-course-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>✨ {t('admin.courses.createTitle')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('admin.courses.courseTitle')} *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('admin.courses.titlePlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('admin.courses.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('admin.courses.descriptionPlaceholder')}
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('admin.courses.level')} *</label>
                <select name="level" value={formData.level} onChange={handleChange} required>
                  <option value="Beginner">🌱 {t('courses.level.beginner')}</option>
                  <option value="Intermediate">📘 {t('courses.level.intermediate')}</option>
                  <option value="Advanced">🚀 {t('courses.level.advanced')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('admin.courses.duration')} *</label>
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
                <label>{t('admin.courses.topic')} *</label>
                <select 
                  name="topicId" 
                  value={formData.topicId} 
                  onChange={handleChange}
                  disabled={loadingTopics}
                  required
                >
                  <option value="">{t('admin.courses.selectTopic')}</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.iconUrl ? '📁 ' : '🏷️ '} {topic.name}
                    </option>
                  ))}
                </select>
                {loadingTopics && <small>{t('common.loading')}</small>}
                {topics.length === 0 && !loadingTopics && (
                  <small className="error-text">{t('admin.courses.noTopics')}</small>
                )}
              </div>

              <div className="form-group">
                <label>{t('admin.courses.price')}</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <small>{t('admin.courses.priceHint')}</small>
              </div>
            </div>

            <div className="form-group">
              <label>{t('admin.courses.thumbnail')}</label>
              <div 
                className="thumbnail-upload" 
                onClick={() => document.getElementById('thumbnail-input').click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleThumbnailChange({ target: { files: [file] } });
                }}
              >
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>📸</span>
                    <p>{t('admin.courses.clickToUpload')}</p>
                    <small>{t('admin.courses.imageHint')}</small>
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
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={loading || topics.length === 0}
              >
                {loading ? t('common.creating') : t('admin.courses.createBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
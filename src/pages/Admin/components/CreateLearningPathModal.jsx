// src/pages/Admin/components/CreateLearningPathModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { learningPathService } from '../../../services/learningPathService';
import { courseService } from '../../../services/courseService';
import './CreateLearningPathModal.css';

export default function CreateLearningPathModal({ onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topicId: '',
  });
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
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError(t('admin.learningPaths.titleRequired'));
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await learningPathService.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        topicId: formData.topicId || null,
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create learning path error:', err);
      setError(err.message || t('admin.learningPaths.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-path-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>🛤️ {t('admin.learningPaths.createTitle')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('admin.learningPaths.pathTitle')} *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('admin.learningPaths.titlePlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('admin.learningPaths.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('admin.learningPaths.descriptionPlaceholder')}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>{t('admin.learningPaths.topic')}</label>
              <select 
                name="topicId" 
                value={formData.topicId} 
                onChange={handleChange}
                disabled={loadingTopics}
              >
                <option value="">{t('admin.learningPaths.selectTopic')}</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? t('common.creating') : t('admin.learningPaths.createBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
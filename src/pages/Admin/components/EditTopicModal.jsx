// src/pages/Admin/components/EditTopicModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import './EditTopicModal.css';

export default function EditTopicModal({ topic, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (topic) {
      setFormData({
        name: topic.name || '',
        description: topic.description || '',
      });
      if (topic.iconUrl) {
        setIconPreview(getImageUrl(topic.iconUrl));
      }
    }
  }, [topic]);

  const getImageUrl = (iconUrl) => {
    if (!iconUrl) return null;
    if (iconUrl.startsWith('/')) {
      return `https://localhost:7021${iconUrl}`;
    }
    return iconUrl;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(t('admin.topicsManager.iconSizeError'));
        return;
      }
      setIconFile(file);
      const previewUrl = URL.createObjectURL(file);
      setIconPreview(previewUrl);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t('admin.topicsManager.nameRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await courseService.updateTopic(topic.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      if (iconFile) {
        await courseService.uploadTopicIcon(topic.id, iconFile);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || t('admin.topicsManager.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-topic-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>✏️ {t('admin.editTopic.title')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('admin.editTopic.topicName')} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('admin.editTopic.namePlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('admin.editTopic.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('admin.editTopic.descriptionPlaceholder')}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>{t('admin.editTopic.icon')}</label>
              <div className="icon-upload" onClick={() => document.getElementById('icon-input').click()}>
                {iconPreview ? (
                  <img src={iconPreview} alt="Icon preview" />
                ) : (
                  <div className="icon-placeholder">
                    <span>📷</span>
                    <p>{t('admin.editTopic.clickToUpload')}</p>
                    <small>{t('admin.editTopic.iconHint')}</small>
                  </div>
                )}
                <input
                  id="icon-input"
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  style={{ display: 'none' }}
                />
              </div>
              {iconPreview && (
                <button 
                  type="button"
                  className="remove-icon-btn"
                  onClick={() => {
                    setIconFile(null);
                    setIconPreview(null);
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
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? t('common.saving') : t('common.update')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
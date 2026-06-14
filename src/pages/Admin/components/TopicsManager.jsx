// src/pages/Admin/components/TopicsManager.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import './TopicsManager.css';

export default function TopicsManager({ onClose, onSuccess }) {
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
      const newTopic = await courseService.createTopic({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      if (iconFile && newTopic.id) {
        await courseService.uploadTopicIcon(newTopic.id, iconFile);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || t('admin.topicsManager.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="topics-manager-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>{t('admin.topicsManager.title')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Two Columns Layout */}
            <div className="form-two-columns">
              {/* Left Column */}
              <div className="form-column">
                <div className="form-group">
                  <label>{t('admin.topicsManager.topicName')} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('admin.topicsManager.namePlaceholder')}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>{t('admin.topicsManager.description')}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t('admin.topicsManager.descriptionPlaceholder')}
                    rows="4"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="form-column">
                <div className="form-group">
                  <label>{t('admin.topicsManager.icon')}</label>
                  <div className="icon-upload" onClick={() => document.getElementById('icon-input').click()}>
                    {iconPreview ? (
                      <img src={iconPreview} alt="Icon preview" />
                    ) : (
                      <div className="icon-placeholder">
                        <span>📷</span>
                        <small>{t('admin.topicsManager.uploadIcon')}</small>
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
                  <p className="icon-hint">{t('admin.topicsManager.iconHint')}</p>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? t('common.creating') : t('admin.topicsManager.createBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
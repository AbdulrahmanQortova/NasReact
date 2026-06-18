// src/pages/Admin/components/Answer/CreateAnswerModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { examService } from '../../../../services/examService';
import { useToast } from '../../../../context/ToastContext';
import './CreateAnswerModal.css';

export default function CreateAnswerModal({ question, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    text: '',
    isCorrect: false,
  });
  const isRTL = i18n.language === 'ar';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      setError(t('admin.exams.answerTextRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const answerData = {
        text: formData.text.trim(),
        isCorrect: formData.isCorrect,
        questionId: question.id,
      };
      
      console.log('📤 Creating answer with data:', answerData);
      
      await examService.createAnswer(question.id, answerData);
      toast.success(t('admin.exams.answerCreateSuccess'));
      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Create answer error:', err);
      setError(err.message || t('admin.exams.answerCreateError'));
      toast.error(err.message || t('admin.exams.answerCreateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-answer-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>✏️ {t('admin.exams.createAnswer')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('admin.exams.answerText')} *</label>
              <input
                type="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder={t('admin.exams.answerTextPlaceholder')}
                required
              />
              <small>{t('admin.exams.answerTextHint')}</small>
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isCorrect"
                  checked={formData.isCorrect}
                  onChange={handleChange}
                />
                {t('admin.exams.markAsCorrect')}
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? t('common.creating') : t('admin.exams.createAnswerBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
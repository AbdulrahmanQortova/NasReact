// src/pages/Admin/components/Question/CreateQuestionModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { examService } from '../../../../services/examService';
import { useToast } from '../../../../context/ToastContext';
import './CreateQuestionModal.css';

export default function CreateQuestionModal({ examId, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    text: '',
    type: 'SingleAnswer',
    points: 1,
    examId: examId,
  });
  const isRTL = i18n.language === 'ar';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      setError(t('admin.exams.questionTextRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await examService.createQuestion(formData);
      toast.success(t('admin.exams.questionCreateSuccess'));
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create question error:', err);
      setError(err.message || t('admin.exams.questionCreateError'));
      toast.error(err.message || t('admin.exams.questionCreateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-question-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>❓ {t('admin.exams.createQuestion')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('admin.exams.questionText')} *</label>
              <textarea
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder={t('admin.exams.questionTextPlaceholder')}
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('admin.exams.questionType')}</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="SingleAnswer">{t('admin.exams.singleAnswer')}</option>
                  <option value="MultipleAnswer">{t('admin.exams.multipleAnswer')}</option>
                  <option value="Text">{t('admin.exams.textAnswer')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('admin.exams.points')}</label>
                <input
                  type="number"
                  name="points"
                  value={formData.points}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? t('common.creating') : t('admin.exams.createQuestionBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
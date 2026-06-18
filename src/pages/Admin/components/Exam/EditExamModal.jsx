// src/pages/Admin/components/Exam/EditExamModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { examService } from '../../../../services/examService';
import { courseService } from '../../../../services/courseService';
import { useToast } from '../../../../context/ToastContext';
import './EditExamModal.css';

export default function EditExamModal({ exam, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    durationInMinutes: 30,
    passingScore: 70,
    isPublished: false,
  });
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    // Initialize form with exam data
    if (exam) {
      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        courseId: exam.courseId || '',
        durationInMinutes: exam.durationInMinutes || 30,
        passingScore: exam.passingScore || 70,
        isPublished: exam.isPublished || false,
      });
    }
    fetchCourses();
  }, [exam]);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAll({ pageSize: 1000 });
      setCourses(response.items || response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t('admin.exams.titleRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const examData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseId: formData.courseId || null,
        durationInMinutes: parseInt(formData.durationInMinutes),
        passingScore: parseInt(formData.passingScore),
        isPublished: formData.isPublished,
      };
      
      await examService.updateExam(exam.id, examData);
      toast.success(t('admin.exams.updateSuccess'));
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Update exam error:', err);
      setError(err.message || t('admin.exams.updateError'));
      toast.error(err.message || t('admin.exams.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-exam-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>✏️ {t('admin.exams.editTitle')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('admin.exams.title')} *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('admin.exams.titlePlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('admin.exams.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('admin.exams.descriptionPlaceholder')}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('admin.exams.course')}</label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  disabled={loadingCourses}
                >
                  <option value="">{t('admin.exams.standalone')}</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('admin.exams.duration')} ({t('admin.exams.minutes')})</label>
                <input
                  type="number"
                  name="durationInMinutes"
                  value={formData.durationInMinutes}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('admin.exams.passingScore')} (%)</label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                  />
                  {t('admin.exams.published')}
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? t('common.saving') : t('admin.exams.updateBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
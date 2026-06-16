// src/pages/Admin/components/LessonsManager.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import { useToast } from '../../../context/ToastContext';
import editIcon from '../../../assets/images/edit.png';
import deleteIcon from '../../../assets/images/delete.png';
import './LessonsManager.css';

export default function LessonsManager({ section, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingLesson, setEditingLesson] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    contentMarkdown: '',
    durationInMinutes: 10,
    order: 1,
    isFreePreview: false,
  });
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchLessons();
  }, [section.id]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const response = await courseService.getLessons(section.id);
      const lessonsData = response.data || response || [];
      const sortedLessons = [...lessonsData].sort((a, b) => a.order - b.order);
      setLessons(sortedLessons);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError(t('admin.lessons.loadError'));
      toast.error(t('admin.lessons.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t('admin.lessons.titleRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await courseService.createLesson(section.id, {
        title: formData.title.trim(),
        videoUrl: formData.videoUrl || null,
        contentMarkdown: formData.contentMarkdown || null,
        durationInMinutes: parseInt(formData.durationInMinutes),
        order: parseInt(formData.order) || lessons.length + 1,
        isFreePreview: formData.isFreePreview,
        courseSectionId: section.id,
      });

      setFormData({ title: '', videoUrl: '', contentMarkdown: '', durationInMinutes: 10, order: lessons.length + 1, isFreePreview: false });
      setShowAddForm(false);
      await fetchLessons();
      toast.success(t('admin.lessons.createSuccess'));
    } catch (err) {
      console.error('Create error:', err);
      const errorMessage = err.message || t('admin.lessons.createError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await courseService.updateLesson(section.id, editingLesson.id, {
        title: formData.title.trim(),
        videoUrl: formData.videoUrl || null,
        contentMarkdown: formData.contentMarkdown || null,
        durationInMinutes: parseInt(formData.durationInMinutes),
        order: parseInt(formData.order),
        isFreePreview: formData.isFreePreview,
      });

      setEditingLesson(null);
      setFormData({ title: '', videoUrl: '', contentMarkdown: '', durationInMinutes: 10, order: lessons.length + 1, isFreePreview: false });
      await fetchLessons();
      toast.success(t('admin.lessons.updateSuccess'));
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage = err.message || t('admin.lessons.updateError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lessonId, lessonTitle) => {
    if (!window.confirm(t('admin.lessons.confirmDelete', { title: lessonTitle }))) return;

    try {
      await courseService.deleteLesson(section.id, lessonId);
      await fetchLessons();
      toast.success(t('admin.lessons.deleteSuccess'));
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err.message || t('admin.lessons.deleteError');
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const startEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      videoUrl: lesson.videoUrl || '',
      contentMarkdown: lesson.contentMarkdown || '',
      durationInMinutes: lesson.durationInMinutes,
      order: lesson.order,
      isFreePreview: lesson.isFreePreview || false,
    });
    setShowAddForm(false);
    setError('');
  };

  const cancelEdit = () => {
    setEditingLesson(null);
    setFormData({ title: '', videoUrl: '', contentMarkdown: '', durationInMinutes: 10, order: lessons.length + 1, isFreePreview: false });
    setError('');
  };

  // ========== Drag and Drop Functions ==========
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.parentNode);
    e.target.classList.add('dragging');
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverItem(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedItem(null);
    setDragOverItem(null);
  };



const handleDrop = async (e, dropIndex) => {
  e.preventDefault();
  
  if (draggedItem === null || draggedItem === dropIndex) {
    setDraggedItem(null);
    setDragOverItem(null);
    return;
  }

  const newLessons = [...lessons];
  const draggedLesson = newLessons[draggedItem];
  newLessons.splice(draggedItem, 1);
  newLessons.splice(dropIndex, 0, draggedLesson);

  const reorderedLessons = newLessons.map((lesson, idx) => ({
    id: lesson.id,
    order: idx + 1
  }));

  setLessons(newLessons.map((lesson, idx) => ({
    ...lesson,
    order: idx + 1
  })));
  
  setDraggedItem(null);
  setDragOverItem(null);

  setSubmitting(true);
  try {
    await courseService.reorderLessons(section.id, reorderedLessons);
    toast.success(t('admin.lessons.reorderSuccess'));
  } catch (err) {
    console.error('Error reordering lessons:', err);
    toast.error(t('admin.lessons.reorderError'));
    await fetchLessons(); 
  } finally {
    setSubmitting(false);
  }
};
  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="lessons-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('admin.lessons.title')} - {section.title}</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body loading">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="lessons-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>📚 {t('admin.lessons.title')} - {section.title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {!showAddForm && !editingLesson && (
            <button className="add-lesson-btn" onClick={() => setShowAddForm(true)}>
              + {t('admin.lessons.addLesson')}
            </button>
          )}

          {(showAddForm || editingLesson) && (
            <div className="lesson-form">
              <h3>{editingLesson ? t('admin.lessons.editLesson') : t('admin.lessons.addNewLesson')}</h3>
              <form onSubmit={editingLesson ? handleUpdate : handleCreate}>
                <div className="form-group">
                  <label>{t('admin.lessons.title')} *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t('admin.lessons.titlePlaceholder')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('admin.lessons.videoUrl')}</label>
                  <input
                    type="text"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    placeholder={t('admin.lessons.videoPlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('admin.lessons.content')}</label>
                  <textarea
                    name="contentMarkdown"
                    value={formData.contentMarkdown}
                    onChange={handleInputChange}
                    placeholder={t('admin.lessons.contentPlaceholder')}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('admin.lessons.duration')}</label>
                    <input
                      type="number"
                      name="durationInMinutes"
                      value={formData.durationInMinutes}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('admin.lessons.order')}</label>
                    <input
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="isFreePreview"
                      checked={formData.isFreePreview}
                      onChange={handleInputChange}
                    />
                    {t('admin.lessons.freePreview')}
                  </label>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="secondary-btn" 
                    onClick={() => {
                      setShowAddForm(false);
                      cancelEdit();
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? t('common.saving') : (editingLesson ? t('common.update') : t('admin.lessons.addBtn'))}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="lessons-list">
            <div className="lessons-header">
              <h3>{t('admin.lessons.existingLessons')} ({lessons.length})</h3>
              <small className="drag-hint">💡 {t('admin.lessons.dragHint')}</small>
            </div>

            {lessons.length === 0 ? (
              <div className="empty-state">
                <p>{t('admin.lessons.noLessons')}</p>
              </div>
            ) : (
              <div className="lessons-items">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`lesson-item ${dragOverItem === index ? 'drag-over' : ''}`}
                    draggable={!editingLesson && !showAddForm}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="drag-handle">⋮⋮</div>
                    <div className="lesson-order">{lesson.order || index + 1}</div>
                    <div className="lesson-info">
                      <strong>{lesson.title}</strong>
                      {lesson.isFreePreview && (
                        <span className="free-badge">{t('admin.lessons.free')}</span>
                      )}
                      <span className="lesson-duration">⏱️ {lesson.durationInMinutes}m</span>
                    </div>
                    <div className="lesson-actions">
                      <button 
                        className="action-circle edit-circle"
                        onClick={() => startEdit(lesson)}
                        title={t('common.edit')}
                      >
                        <img src={editIcon} alt="edit" className="action-icon" />
                      </button>
                      <button 
                        className="action-circle delete-circle"
                        onClick={() => handleDelete(lesson.id, lesson.title)}
                        title={t('common.delete')}
                      >
                        <img src={deleteIcon} alt="delete" className="action-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// src/pages/Admin/components/StepsManagementModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { learningPathService } from '../../../services/learningPathService';
import { courseService } from '../../../services/courseService';
import { useToast } from '../../../context/ToastContext';
import editIcon from '../../../assets/images/edit.png';
import deleteIcon from '../../../assets/images/delete.png';
import './StepsManagementModal.css';

export default function StepsManagementModal({ path, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [steps, setSteps] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [error, setError] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [formData, setFormData] = useState({
    courseId: '',
    order: 1,
  });
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchSteps();
    fetchCourses();
  }, [path.id]);

  const fetchSteps = async () => {
    setLoading(true);
    try {
      const response = await learningPathService.getSteps(path.id);
      const stepsData = response.data || response || [];
      // ترتيب حسب order
      const sortedSteps = [...stepsData].sort((a, b) => a.order - b.order);
      setSteps(sortedSteps);
    } catch (error) {
      console.error('Error fetching steps:', error);
      toast.error(t('admin.steps.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAll({ pageSize: 1000 });
      const coursesData = response.items || response.data || [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStep = async (e) => {
    e.preventDefault();
    if (!formData.courseId) {
      setError(t('admin.steps.courseRequired'));
      return;
    }
    if (!formData.order || formData.order < 1) {
      setError(t('admin.steps.orderRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await learningPathService.addStep(path.id, {
        courseId: formData.courseId,
        order: parseInt(formData.order),
      });

      setFormData({ courseId: '', order: steps.length + 1 });
      setShowAddForm(false);
      await fetchSteps();
      toast.success(t('admin.steps.addSuccess'));
    } catch (err) {
      console.error('Error adding step:', err);
      const errorMessage = err.message || t('admin.steps.addError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStep = async (e) => {
    e.preventDefault();
    if (!formData.courseId) {
      setError(t('admin.steps.courseRequired'));
      return;
    }
    if (!formData.order || formData.order < 1) {
      setError(t('admin.steps.orderRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await learningPathService.updateStep(path.id, editingStep.id, {
        courseId: formData.courseId,
        order: parseInt(formData.order),
      });

      setEditingStep(null);
      setFormData({ courseId: '', order: steps.length + 1 });
      await fetchSteps();
      toast.success(t('admin.steps.updateSuccess'));
    } catch (err) {
      console.error('Error updating step:', err);
      const errorMessage = err.message || t('admin.steps.updateError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStep = async (stepId, stepTitle) => {
    if (!window.confirm(t('admin.steps.confirmDelete', { title: stepTitle }))) return;

    try {
      await learningPathService.removeStep(path.id, stepId);
      await fetchSteps();
      toast.success(t('admin.steps.deleteSuccess'));
    } catch (err) {
      console.error('Error deleting step:', err);
      toast.error(t('admin.steps.deleteError'));
    }
  };

  const startEdit = (step) => {
    setEditingStep(step);
    setFormData({
      courseId: step.courseId,
      order: step.order,
    });
    setShowAddForm(false);
    setError('');
  };

  const cancelEdit = () => {
    setEditingStep(null);
    setFormData({ courseId: '', order: steps.length + 1 });
    setError('');
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || t('admin.steps.unknownCourse');
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

    // إعادة ترتيب الـ Steps محلياً
    const newSteps = [...steps];
    const draggedStep = newSteps[draggedItem];
    newSteps.splice(draggedItem, 1);
    newSteps.splice(dropIndex, 0, draggedStep);


    const reorderedSteps = newSteps.map((step, idx) => ({
      ...step,
      order: idx + 1
    }));

    setSteps(reorderedSteps);
    setDraggedItem(null);
    setDragOverItem(null);

    setSubmitting(true);
    try {
      for (const step of reorderedSteps) {
        await learningPathService.updateStep(path.id, step.id, {
          courseId: step.courseId,
          order: step.order,
        });
      }
      toast.success(t('admin.steps.reorderSuccess'));
    } catch (err) {
      console.error('Error reordering steps:', err);
      toast.error(t('admin.steps.reorderError'));
      await fetchSteps();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="steps-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('admin.steps.title')} - {path.title}</h2>
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
      <div className="steps-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>📋 {t('admin.steps.title')} - {path.title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* Add Step Button */}
          {!showAddForm && !editingStep && (
            <button className="add-step-btn" onClick={() => setShowAddForm(true)}>
              + {t('admin.steps.addStep')}
            </button>
          )}

          {/* Add/Edit Form */}
          {(showAddForm || editingStep) && (
            <div className="step-form">
              <h3>{editingStep ? t('admin.steps.editStep') : t('admin.steps.addNewStep')}</h3>
              <form onSubmit={editingStep ? handleUpdateStep : handleAddStep}>
                <div className="form-group">
                  <label>{t('admin.steps.course')} *</label>
                  <select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">{t('admin.steps.selectCourse')}</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('admin.steps.order')} *</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                  <small>{t('admin.steps.orderHint')}</small>
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
                    {submitting ? t('common.saving') : (editingStep ? t('common.update') : t('admin.steps.addBtn'))}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Steps List with Drag and Drop */}
          <div className="steps-list">
            <div className="steps-header">
              <h3>{t('admin.steps.existingSteps')} ({steps.length})</h3>
              <small className="drag-hint">💡 {t('admin.steps.dragHint')}</small>
            </div>

            {steps.length === 0 ? (
              <div className="empty-state">
                <p>{t('admin.steps.noSteps')}</p>
              </div>
            ) : (
              <div className="steps-items">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`step-item ${dragOverItem === index ? 'drag-over' : ''}`}
                    draggable={!editingStep && !showAddForm}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="drag-handle">⋮⋮</div>
                    <div className="step-order">{step.order}</div>
                    <div className="step-info">
                      <strong>{getCourseTitle(step.courseId)}</strong>
                    </div>
                    <div className="step-actions">
                      <button 
                        className="action-btn edit-action"
                        onClick={() => startEdit(step)}
                        title={t('common.edit')}
                      >
                        <img src={editIcon} alt="edit" className="action-icon" />
                      </button>
                      <button 
                        className="action-btn delete-action"
                        onClick={() => handleDeleteStep(step.id, getCourseTitle(step.courseId))}
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
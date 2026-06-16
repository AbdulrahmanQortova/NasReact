// src/pages/Admin/components/CourseSectionsManager.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import LessonsManager from './LessonsManager';
import editIcon from '../../../assets/images/edit.png';
import deleteIcon from '../../../assets/images/delete.png';
import './CourseSectionsManager.css';

export default function CourseSectionsManager({ course, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    order: 0,
  });
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchSections();
  }, [course.id]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await courseService.getCourseSections(course.id);
      const sectionsData = response.data || response || [];
      const sortedSections = [...sectionsData].sort((a, b) => a.order - b.order);
      setSections(sortedSections);
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError(t('admin.sections.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t('admin.sections.titleRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await courseService.createCourseSection(course.id, {
        title: formData.title.trim(),
        order: parseInt(formData.order) || sections.length + 1,
        courseId: course.id,
      });

      setFormData({ title: '', order: 0 });
      await fetchSections();
    } catch (err) {
      setError(err.message || t('admin.sections.createError'));
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
      await courseService.updateCourseSection(course.id, editingSection.id, {
        title: formData.title.trim(),
        order: parseInt(formData.order),
      });

      setEditingSection(null);
      setFormData({ title: '', order: 0 });
      await fetchSections();
    } catch (err) {
      setError(err.message || t('admin.sections.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sectionId, sectionTitle) => {
    if (!window.confirm(t('admin.sections.confirmDelete', { title: sectionTitle }))) return;

    try {
      await courseService.deleteCourseSection(course.id, sectionId);
      await fetchSections();
    } catch (err) {
      setError(err.message || t('admin.sections.deleteError'));
    }
  };

  const startEdit = (section) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      order: section.order,
    });
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setFormData({ title: '', order: 0 });
    setError('');
  };

  const handleManageLessons = (section) => {
    setSelectedSection(section);
    setShowLessonsModal(true);
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

    const newSections = [...sections];
    const draggedSection = newSections[draggedItem];
    newSections.splice(draggedItem, 1);
    newSections.splice(dropIndex, 0, draggedSection);

    const reorderedSections = newSections.map((section, idx) => ({
      ...section,
      order: idx + 1
    }));

    setSections(reorderedSections);
    setDraggedItem(null);
    setDragOverItem(null);

    setSubmitting(true);
    try {
      for (const section of reorderedSections) {
        await courseService.updateCourseSection(course.id, section.id, {
          title: section.title,
          order: section.order,
        });
      }
    } catch (err) {
      console.error('Error reordering sections:', err);
      toast.error(t('admin.sections.reorderError'));
      await fetchSections();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sections-manager-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>{t('admin.sections.title')} - {course.title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* Add/Edit Section Form */}
          <div className="sections-form">
            <h3>{editingSection ? t('admin.sections.editSection') : t('admin.sections.addSection')}</h3>
            <form onSubmit={editingSection ? handleUpdate : handleCreate}>
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>{t('admin.sections.sectionTitle')} *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t('admin.sections.titlePlaceholder')}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label>{t('admin.sections.order')}</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    placeholder={t('admin.sections.orderPlaceholder')}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-actions">
                {editingSection && (
                  <button type="button" className="secondary-btn" onClick={cancelEdit}>
                    {t('common.cancel')}
                  </button>
                )}
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting 
                    ? t('common.saving') 
                    : editingSection 
                      ? t('admin.sections.updateBtn') 
                      : t('admin.sections.addBtn')}
                </button>
              </div>
            </form>
          </div>

          {/* Sections List with Drag and Drop */}
          <div className="sections-list">
            <div className="sections-header">
              <h3>{t('admin.sections.existingSections')} ({sections.length})</h3>
              <small className="drag-hint">💡 {t('admin.sections.dragHint')}</small>
            </div>

            {loading ? (
              <div className="loading-spinner">{t('common.loading')}</div>
            ) : sections.length === 0 ? (
              <div className="empty-state">{t('admin.sections.noSections')}</div>
            ) : (
              <div className="sections-items">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`section-item ${dragOverItem === index ? 'drag-over' : ''}`}
                    draggable={!editingSection && !editingSection}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="drag-handle">⋮⋮</div>
                    <div className="section-order">{section.order || index + 1}</div>
                    <div className="section-info">
                      <strong>{section.title}</strong>
                    </div>
                    <div className="section-actions">
                      <button 
                        className="action-circle edit-circle"
                        onClick={() => startEdit(section)}
                        title={t('common.edit')}
                      >
                        <img src={editIcon} alt="edit" className="action-icon" />
                      </button>
                      <button 
                        className="action-circle delete-circle"
                        onClick={() => handleDelete(section.id, section.title)}
                        title={t('common.delete')}
                      >
                        <img src={deleteIcon} alt="delete" className="action-icon" />
                      </button>
                      <button 
                        className="action-circle lessons-circle"
                        onClick={() => handleManageLessons(section)}
                        title={t('admin.sections.manageLessons')}
                      >
                        📚
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lessons Manager Modal */}
      {showLessonsModal && selectedSection && (
        <LessonsManager
          section={selectedSection}
          onClose={() => {
            setShowLessonsModal(false);
            setSelectedSection(null);
          }}
          onSuccess={() => {
            setShowLessonsModal(false);
            setSelectedSection(null);
          }}
        />
      )}
    </div>
  );
}
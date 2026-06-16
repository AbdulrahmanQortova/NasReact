// src/pages/Admin/CourseDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../services/courseService';
import LessonsManager from './components/LessonsManager';
import { useToast } from '../../context/ToastContext';
import editIcon from '../../assets/images/edit.png';
import deleteIcon from '../../assets/images/delete.png';
import './CourseDetails.css';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
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
    fetchCourseDetails();
    fetchSections();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const response = await courseService.getById(id);
      setCourse(response.data || response);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error(t('admin.courseDetails.loadError'));
    }
  };

  const fetchSections = async () => {
    try {
      const response = await courseService.getCourseSections(id);
      const sectionsData = response.data || response || [];
      const sortedSections = [...sectionsData].sort((a, b) => a.order - b.order);
      setSections(sortedSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error(t('admin.courseDetails.sectionsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t('admin.courseDetails.titleRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await courseService.createCourseSection(id, {
        title: formData.title.trim(),
        order: parseInt(formData.order) || sections.length + 1,
        courseId: id,
      });

      setFormData({ title: '', order: 0 });
      setShowAddSection(false);
      await fetchSections();
      toast.success(t('admin.courseDetails.addSuccess'));
    } catch (err) {
      console.error('Create error:', err);
      setError(err.message || t('admin.courseDetails.createError'));
      toast.error(err.message || t('admin.courseDetails.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const updateData = { title: formData.title.trim() };
      
      if (formData.order && parseInt(formData.order) !== editingSection.order) {
        updateData.order = parseInt(formData.order);
      }
      
      await courseService.updateCourseSection(id, editingSection.id, updateData);

      setEditingSection(null);
      setFormData({ title: '', order: 0 });
      await fetchSections();
      toast.success(t('admin.courseDetails.updateSuccess'));
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || t('admin.courseDetails.updateError'));
      toast.error(err.message || t('admin.courseDetails.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (sectionId, sectionTitle) => {
    if (!window.confirm(t('admin.courseDetails.confirmDelete', { title: sectionTitle }))) return;

    try {
      await courseService.deleteCourseSection(id, sectionId);
      await fetchSections();
      toast.success(t('admin.courseDetails.deleteSuccess'));
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || t('admin.courseDetails.deleteError'));
      toast.error(err.message || t('admin.courseDetails.deleteError'));
    }
  };

  const startEdit = (section) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      order: section.order,
    });
    setShowAddSection(false);
    setError('');
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
        await courseService.updateCourseSection(id, section.id, {
          title: section.title,
          order: section.order,
        });
      }
      toast.success(t('admin.courseDetails.reorderSuccess'));
    } catch (err) {
      console.error('Error reordering sections:', err);
      toast.error(t('admin.courseDetails.reorderError'));
      await fetchSections();
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (thumbnailUrl) => {
    if (!thumbnailUrl) return null;
    if (thumbnailUrl.startsWith('/')) {
      return `https://localhost:7021${thumbnailUrl}`;
    }
    return thumbnailUrl;
  };

  const getLevelName = (level) => {
    const levelMap = { 
      0: t('courses.level.beginner'), 
      1: t('courses.level.intermediate'), 
      2: t('courses.level.advanced') 
    };
    return levelMap[level] || t('courses.level.beginner');
  };

  const getLevelClass = (level) => {
    const levelMap = { 0: 'beginner', 1: 'intermediate', 2: 'advanced' };
    return levelMap[level] || 'beginner';
  };

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return t('courses.free');
    if (numPrice <= 0) return t('courses.free');
    return `$${numPrice.toFixed(2)}`;
  };

  if (loading && !course) {
    return (
      <div className="course-details-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-details-error">
        <p>{t('admin.courseDetails.notFound')}</p>
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="course-details-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
        ← {t('common.back')}
      </button>

      {/* Course Info Section */}
      <div className="course-info-section">
        <div className="course-info-header">
          <div className="course-thumbnail-large">
            {course.thumbnailUrl ? (
              <img src={getImageUrl(course.thumbnailUrl)} alt={course.title} />
            ) : (
              <div className="thumbnail-placeholder-large">📚</div>
            )}
          </div>
          <div className="course-info-content">
            <h1>{course.title}</h1>
            <p className="course-description">{course.description}</p>
            <div className="course-meta-details">
              <div className="meta-item">
                <span className="meta-icon">📊</span>
                <span className={`level-badge level-${getLevelClass(course.level)}`}>
                  {getLevelName(course.level)}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">⏱️</span>
                <span>{course.durationInMinutes} {t('admin.courses.minutes')}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">💰</span>
                <span className={course.price > 0 ? "price-value" : "price-free"}>
                  {formatPrice(course.price)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections Section */}
      <div className="sections-section">
        <div className="sections-header">
          <h2>{t('admin.courseDetails.sections')}</h2>
          <button className="add-section-btn" onClick={() => {
            setShowAddSection(!showAddSection);
            setEditingSection(null);
            setFormData({ title: '', order: 0 });
          }}>
            + {t('admin.courseDetails.addSection')}
          </button>
        </div>

        {/* Add/Edit Section Form */}
        {(showAddSection || editingSection) && (
          <div className="section-form-container">
            <h3>{editingSection ? t('admin.courseDetails.editSection') : t('admin.courseDetails.addNewSection')}</h3>
            <form onSubmit={editingSection ? handleUpdateSection : handleAddSection}>
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>{t('admin.courseDetails.sectionTitle')} *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t('admin.courseDetails.titlePlaceholder')}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label>{t('admin.courseDetails.order')}</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    placeholder={t('admin.courseDetails.orderPlaceholder')}
                    min="1"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => {
                    setShowAddSection(false);
                    cancelEdit();
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting 
                    ? t('common.saving') 
                    : editingSection 
                      ? t('common.update') 
                      : t('admin.courseDetails.addBtn')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sections List */}
        {error && <div className="error-message">{error}</div>}

        {sections.length === 0 ? (
          <div className="no-sections">
            <p>{t('admin.courseDetails.noSections')}</p>
          </div>
        ) : (
          <div className="sections-list-modern">
            <div className="sections-header-modern">
              <h3>{t('admin.courseDetails.existingSections')} ({sections.length})</h3>
              <small className="drag-hint">💡 {t('admin.courseDetails.dragHint')}</small>
            </div>
            <div className="sections-items-modern">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`section-item-modern ${dragOverItem === index ? 'drag-over' : ''}`}
                  draggable={!editingSection}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="drag-handle">⋮⋮</div>
                  <div className="section-order-modern">{section.order || index + 1}</div>
                  <div className="section-info-modern">
                    <strong>{section.title}</strong>
                  </div>
                  <div className="section-actions-modern">
                    <button 
                      className="action-circle edit-circle"
                      onClick={() => startEdit(section)}
                      title={t('common.edit')}
                    >
                      <img src={editIcon} alt="edit" className="action-icon" />
                    </button>
                    <button 
                      className="action-circle delete-circle"
                      onClick={() => handleDeleteSection(section.id, section.title)}
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
          </div>
        )}
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
            fetchSections();
          }}
        />
      )}
    </div>
  );
}
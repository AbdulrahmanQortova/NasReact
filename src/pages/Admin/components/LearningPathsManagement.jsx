// src/pages/Admin/components/LearningPathsManagement.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { learningPathService } from '../../../services/learningPathService';
import CreateLearningPathModal from './CreateLearningPathModal';
import EditLearningPathModal from './EditLearningPathModal';
import StepsManagementModal from './StepsManagementModal';
import editIcon from '../../../assets/images/edit.png';
import deleteIcon from '../../../assets/images/delete.png';
import { useToast } from '../../../context/ToastContext';
import './LearningPathsManagement.css';

export default function LearningPathsManagement() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedPathForSteps, setSelectedPathForSteps] = useState(null);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const fetchLearningPaths = async () => {
    setLoading(true);
    try {
      const response = await learningPathService.getAll();
      const pathsData = response.data || response || [];
      setLearningPaths(pathsData);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      toast.error(t('admin.learningPaths.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePath = async (pathId, pathTitle) => {
    if (!window.confirm(t('admin.learningPaths.confirmDelete', { title: pathTitle }))) return;
    try {
      await learningPathService.delete(pathId);
      await fetchLearningPaths();
      toast.success(t('admin.learningPaths.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting learning path:', error);
      toast.error(t('admin.learningPaths.deleteFailed'));
    }
  };

  const handleEditPath = (path) => {
    setSelectedPath(path);
    setShowEditModal(true);
  };

  const handleManageSteps = (path) => {
    setSelectedPathForSteps(path);
    setShowStepsModal(true);
  };

  if (loading) {
    return <div className="management-loading">{t('admin.learningPaths.loading')}</div>;
  }

  return (
    <div className="learning-paths-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="management-header">
        <div className="header-info">
          <h2>{t('admin.learningPaths.title')}</h2>
          <span className="path-count">{t('admin.learningPaths.total', { count: learningPaths.length })}</span>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          + {t('admin.learningPaths.createNew')}
        </button>
      </div>

      {learningPaths.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin.learningPaths.noPaths')}</p>
          <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
            {t('admin.learningPaths.createFirst')}
          </button>
        </div>
      ) : (
        <div className="learning-paths-grid">
          {learningPaths.map(path => (
            <div key={path.id} className="learning-path-card">
              {/* Card Header with Actions */}
              <div className="card-header-wrapper">
                <div className="card-header">
                  <h3 className="card-title">{path.title}</h3>
                  <div className="card-actions">
                    <button 
                      className="action-circle edit-circle"
                      onClick={() => handleEditPath(path)}
                      title={t('common.edit')}
                    >
                      <img src={editIcon} alt="edit" className="action-icon" />
                    </button>
                    <button 
                      className="action-circle delete-circle"
                      onClick={() => handleDeletePath(path.id, path.title)}
                      title={t('common.delete')}
                    >
                      <img src={deleteIcon} alt="delete" className="action-icon" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="card-content">
                <p className="card-description">
                  {path.description?.substring(0, 100)}
                  {path.description?.length > 100 ? '...' : ''}
                </p>
                <div className="card-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📚</span>
                    <span>{path.steps?.length || 0} {t('admin.learningPaths.steps')}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <button 
                className="manage-steps-btn"
                onClick={() => handleManageSteps(path)}
              >
                📋 {t('admin.learningPaths.manageSteps')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showCreateModal && (
        <CreateLearningPathModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchLearningPaths();
            setShowCreateModal(false);
            toast.success(t('admin.learningPaths.createSuccess'));
          }}
        />
      )}

      {/* Edit Learning Path Modal */}
      {showEditModal && selectedPath && (
        <EditLearningPathModal
          path={selectedPath}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPath(null);
          }}
          onSuccess={() => {
            fetchLearningPaths();
            setShowEditModal(false);
            setSelectedPath(null);
            toast.success(t('admin.learningPaths.updateSuccess'));
          }}
        />
      )}

      {/* Steps Management Modal */}
      {showStepsModal && selectedPathForSteps && (
        <StepsManagementModal
          path={selectedPathForSteps}
          onClose={() => {
            setShowStepsModal(false);
            setSelectedPathForSteps(null);
          }}
          onSuccess={() => {
            setShowStepsModal(false);
            setSelectedPathForSteps(null);
            fetchLearningPaths(); 
          }}
        />
      )}
    </div>
  );
}
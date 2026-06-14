// src/pages/Admin/components/TopicsManagement.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import TopicsManager from './TopicsManager';
import EditTopicModal from './EditTopicModal';
import editIcon from '../../../assets/images/edit.png';
import deleteIcon from '../../../assets/images/delete.png';
import './TopicsManagement.css';

export default function TopicsManagement() {
  const { t, i18n } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopicsManager, setShowTopicsManager] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const response = await courseService.getAllTopics();
      const topicsData = response.data || response || [];
      setTopics(topicsData);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId, topicName) => {
    if (!window.confirm(t('admin.topics.confirmDelete', { name: topicName }))) return;
    try {
      await courseService.deleteTopic(topicId);
      await fetchTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert(t('admin.topics.deleteFailed'));
    }
  };

  const handleEditTopic = (topic) => {
    setSelectedTopic(topic);
    setShowEditModal(true);
  };

  const getImageUrl = (iconUrl) => {
    if (!iconUrl) return null;
    if (iconUrl.startsWith('/')) {
      return `https://localhost:7021${iconUrl}`;
    }
    return iconUrl;
  };

  if (loading) {
    return <div className="management-loading">{t('admin.topics.loading')}</div>;
  }

  return (
    <div className="management-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="management-header">
        <div className="header-info">
          <h2>{t('admin.topics.title')}</h2>
          <span className="topic-count">{t('admin.topics.total', { count: topics.length })}</span>
        </div>
        <button className="create-btn" onClick={() => setShowTopicsManager(true)}>
          + {t('admin.topics.createNew')}
        </button>
      </div>

      {topics.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin.topics.noTopics')}</p>
          <button className="primary-btn" onClick={() => setShowTopicsManager(true)}>
            {t('admin.topics.createFirst')}
          </button>
        </div>
      ) : (
        <div className="topics-grid">
          {topics.map(topic => (
            <div key={topic.id} className="topic-management-card">
              {/* Card Image with overlay */}
              <div className="topic-card-image-wrapper">
                <div className="topic-icon-large">
                  {topic.iconUrl ? (
                    <img src={getImageUrl(topic.iconUrl)} alt={topic.name} />
                  ) : (
                    <span>🏷️</span>
                  )}
                </div>
                
                {/* Action Buttons - Circles like courses */}
                <div className="topic-card-actions">
                  <button 
                    className="action-circle edit-circle"
                    onClick={() => handleEditTopic(topic)}
                    title={t('common.edit')}
                  >
                    <img src={editIcon} alt="edit" className="action-icon" />
                  </button>
                  <button 
                    className="action-circle delete-circle"
                    onClick={() => handleDeleteTopic(topic.id, topic.name)}
                    title={t('common.delete')}
                  >
                    <img src={deleteIcon} alt="delete" className="action-icon" />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="topic-card-content">
                <h3 className="topic-card-title">{topic.name}</h3>
                <p className="topic-card-description">
                  {topic.description || t('admin.topics.noDescription')}
                </p>
                <div className="topic-card-stats">
                  <span>📚 {t('admin.topics.coursesCount', { count: topic.coursesCount || 0 })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Topic Modal */}
      {showTopicsManager && (
        <TopicsManager
          onClose={() => setShowTopicsManager(false)}
          onSuccess={() => {
            fetchTopics();
            setShowTopicsManager(false);
          }}
        />
      )}

      {/* Edit Topic Modal */}
      {showEditModal && selectedTopic && (
        <EditTopicModal
          topic={selectedTopic}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTopic(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTopic(null);
            fetchTopics();
          }}
        />
      )}
    </div>
  );
}
// src/pages/Admin/components/TopicsManagement.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import TopicsManager from './TopicsManager';
import './TopicsManagement.css';

export default function TopicsManagement() {
  const { t, i18n } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopicsManager, setShowTopicsManager] = useState(false);
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
              <div className="topic-icon-large">
                {topic.iconUrl ? (
                  <img src={getImageUrl(topic.iconUrl)} alt={topic.name} />
                ) : (
                  <span>🏷️</span>
                )}
              </div>
              <div className="topic-info-large">
                <h3>{topic.name}</h3>
                <p>{topic.description || t('admin.topics.noDescription')}</p>
                <div className="topic-stats">
                  <span>📚 {t('admin.topics.coursesCount', { count: topic.coursesCount || 0 })}</span>
                </div>
              </div>
              <div className="topic-actions-large">
                <button 
                  className="delete-btn" 
                  onClick={() => handleDeleteTopic(topic.id, topic.name)}
                >
                  {t('admin.topics.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTopicsManager && (
        <TopicsManager
          onClose={() => setShowTopicsManager(false)}
          onSuccess={() => {
            fetchTopics();
            setShowTopicsManager(false);
          }}
        />
      )}
    </div>
  );
}
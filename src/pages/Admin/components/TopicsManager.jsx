// src/pages/Admin/components/TopicsManager.jsx
import { useState, useEffect } from 'react';
import { courseService } from '../../../services/courseService';
import './TopicsManager.css';

export default function TopicsManager({ onClose, onSuccess }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const response = await courseService.getAllTopics();
      setTopics(response.data || response || []);
    } catch (err) {
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Icon size must be less than 2MB');
        return;
      }
      setIconFile(file);
      const previewUrl = URL.createObjectURL(file);
      setIconPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Topic name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const newTopic = await courseService.createTopic({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      if (iconFile && newTopic.id) {
        await courseService.uploadTopicIcon(newTopic.id, iconFile);
      }

      setFormData({ name: '', description: '' });
      setIconFile(null);
      setIconPreview(null);
      await fetchTopics();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create topic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId, topicName) => {
    if (!window.confirm(`Delete topic "${topicName}"? This may affect related courses.`)) return;
    
    try {
      await courseService.deleteTopic(topicId);
      await fetchTopics();
    } catch (err) {
      setError(err.message || 'Failed to delete topic');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="topics-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏷️ Manage Topics</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* Create Topic Form */}
          <div className="create-topic-form">
            <h3>Create New Topic</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Topic Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Programming, Design, Business"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Icon (Optional)</label>
                  <div className="icon-upload" onClick={() => document.getElementById('icon-input').click()}>
                    {iconPreview ? (
                      <img src={iconPreview} alt="Icon preview" />
                    ) : (
                      <div className="icon-placeholder">
                        <span>📷</span>
                        <small>Upload icon</small>
                      </div>
                    )}
                    <input
                      id="icon-input"
                      type="file"
                      accept="image/*"
                      onChange={handleIconChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Topic description..."
                  rows="2"
                />
              </div>

              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Creating...' : '+ Create Topic'}
              </button>
            </form>
          </div>

          {/* Topics List */}
          <div className="topics-list">
            <h3>Existing Topics ({topics.length})</h3>
            {loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : topics.length === 0 ? (
              <div className="empty-state">No topics yet. Create your first topic above.</div>
            ) : (
              <div className="topics-items">
                {topics.map(topic => (
                  <div key={topic.id} className="topic-item">
                    <div className="topic-item-icon">
                      {topic.iconUrl ? (
                        <img src={topic.iconUrl} alt={topic.name} />
                      ) : (
                        <span>🏷️</span>
                      )}
                    </div>
                    <div className="topic-item-info">
                      <strong>{topic.name}</strong>
                      {topic.description && <p>{topic.description}</p>}
                    </div>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteTopic(topic.id, topic.name)}
                    >
                      Delete
                    </button>
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
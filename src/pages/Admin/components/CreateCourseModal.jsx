// src/pages/Admin/components/CreateCourseModal.jsx
import { useState, useEffect } from 'react';
import { courseService } from '../../../services/courseService';
import './CreateCourseModal.css';

export default function CreateCourseModal({ onClose, onSuccess }) {
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'Beginner',
    durationInMinutes: 60,
    topicId: '',
    price: 0,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await courseService.getAllTopics();
      const topicsData = response.data || response || [];
      setTopics(topicsData);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load topics');
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, GIF, and WEBP images are allowed');
        return;
      }
      
      setThumbnail(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      setError('');
    }
  };

  const uploadThumbnail = async (courseId) => {
    if (!thumbnail) return null;
    
    try {
      console.log('Uploading file:', thumbnail.name);
      
      const formData = new FormData();
      formData.append('file', thumbnail);
      
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`https://localhost:7021/api/Courses/${courseId}/thumbnail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      const result = await response.json();
      console.log('Upload success:', result);
      return result;
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Course title is required');
      return;
    }
    
    if (!formData.topicId) {
      setError('Please select a topic/category');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const levelNumber = {
        'Beginner': 0,
        'Intermediate': 1,
        'Advanced': 2
      };
      
      // ✅ إضافة Price إلى البيانات المرسلة
      const courseData = {
        Title: formData.title.trim(),
        Description: formData.description.trim() || null,
        Level: levelNumber[formData.level],
        DurationInMinutes: parseInt(formData.durationInMinutes),
        TopicId: formData.topicId,
        Price: parseFloat(formData.price) || 0,
      };
      
      console.log('Sending course data:', JSON.stringify(courseData, null, 2));
      
      const course = await courseService.create(courseData);
      console.log('Course created:', course);
      
      if (thumbnail && course.id) {
        console.log('Uploading thumbnail for course:', course.id);
        await uploadThumbnail(course.id);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create course error:', err);
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-course-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✨ Create New Course</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Course Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., React for Beginners"
              required
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Course description..."
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Level *</label>
              <select name="level" value={formData.level} onChange={handleChange} required>
                <option value="Beginner">🌱 Beginner</option>
                <option value="Intermediate">📘 Intermediate</option>
                <option value="Advanced">🚀 Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                name="durationInMinutes"
                value={formData.durationInMinutes}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Topic / Category *</label>
              <select 
                name="topicId" 
                value={formData.topicId} 
                onChange={handleChange}
                disabled={loadingTopics}
                required
              >
                <option value="">Select a topic</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.iconUrl ? '📁 ' : '🏷️ '} {topic.name}
                  </option>
                ))}
              </select>
              {loadingTopics && <small>Loading topics...</small>}
              {topics.length === 0 && !loadingTopics && (
                <small className="error-text">No topics available. Please create a topic first.</small>
              )}
            </div>

            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              <small>Leave 0 for free course</small>
            </div>
          </div>

          <div className="form-group">
            <label>Thumbnail Image (Optional)</label>
            <div 
              className="thumbnail-upload" 
              onClick={() => document.getElementById('thumbnail-input').click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleThumbnailChange({ target: { files: [file] } });
              }}
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumbnail preview" />
              ) : (
                <div className="upload-placeholder">
                  <span>📸</span>
                  <p>Click or drag to upload thumbnail</p>
                  <small>PNG, JPG, GIF up to 5MB</small>
                </div>
              )}
              <input
                id="thumbnail-input"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                style={{ display: 'none' }}
              />
            </div>
            {thumbnailPreview && (
              <button 
                type="button"
                className="remove-thumbnail-btn"
                onClick={() => {
                  setThumbnail(null);
                  setThumbnailPreview(null);
                }}
              >
                Remove image
              </button>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn" 
              disabled={loading || topics.length === 0}
            >
              {loading ? '⏳ Creating...' : '✨ Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
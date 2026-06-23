// src/pages/Community/components/CreatePost.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { postService } from '../../../services/postService';
import { useToast } from '../../../context/ToastContext';
import { authService } from '../../../services/authService';
import './CreatePost.css';

export default function CreatePost({ onPostCreated, onCancel }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error(t('community.fillAllFields'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (hashtags) formData.append('hashtags', hashtags);
      if (file) formData.append('file', file);

      await postService.createPost(formData);
      
      setTitle('');
      setContent('');
      setHashtags('');
      setFile(null);
      
      toast.success(t('community.postCreated'));
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.message || t('community.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="create-post-modal">
      <div className="create-post-container">
        <div className="modal-header">
          <h2>{t('community.createPost')}</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder={t('community.postTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              maxLength="200"
            />
          </div>

          <div className="form-group">
            <textarea
              placeholder={t('community.postContent')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-textarea"
              rows="5"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder={t('community.hashtags')}
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="form-input"
            />
            <small className="form-hint">{t('community.hashtagsHint')}</small>
          </div>

          <div className="form-group">
            <div className="file-upload-wrapper">
              <label className="file-upload-label">
                <span className="upload-icon">📎</span>
                {file ? file.name : t('community.uploadMedia')}
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="file-upload-input"
                  accept="image/*,video/*"
                />
              </label>
              {file && (
                <button type="button" className="remove-file-btn" onClick={removeFile}>
                  ✕
                </button>
              )}
            </div>
            <small className="form-hint">{t('community.uploadHint')}</small>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? t('common.posting') : t('community.post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
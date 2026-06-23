// src/pages/Community/components/EditPostModal.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faImage, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { postService } from '../../../services/postService';
import { useToast } from '../../../context/ToastContext';
import Dialog from '../../../components/ui/Dialog';
import './EditPostModal.css';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || 'https://localhost:7021/api';
  const baseWithoutApi = baseUrl.replace('/api', '');
  return url.startsWith('/') ? `${baseWithoutApi}${url}` : `${baseWithoutApi}/${url}`;
};

export default function EditPostModal({ post, onClose, onPostUpdated }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [currentMediaUrl, setCurrentMediaUrl] = useState(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // ✅ ref واحد بس لكل الـ inputs
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setCurrentMediaUrl(post.mediaUrl || null);
      setRemoveMedia(false);
      setFile(null);
    }
  }, [post]);

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

      if (removeMedia) {
        formData.append('mediaAction', '2');
      } else if (file) {
        formData.append('file', file);
        formData.append('mediaAction', '1');
      } else {
        formData.append('mediaAction', '0');
      }

      const response = await postService.updatePost(post.id, formData);
      toast.success(t('community.postUpdated'));

if (onPostUpdated) {
  const updatedPost = {
    ...post,          
    ...response,     
    
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    isLiked: post.isLiked,
    authorName: post.authorName,
  };
  onPostUpdated(updatedPost);
}
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.message || t('community.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setRemoveMedia(false);
      // ✅ نمسح الـ value عشان لو اختار نفس الفايل تاني مرة يشتغل
      e.target.value = '';
    }
  };

  const handleRemoveMedia = () => {
    setRemoveMedia(true);
    setFile(null);
  };

  const handleCancelRemoveMedia = () => {
    setRemoveMedia(false);
  };

  // ✅ إصلاح: triggerFileInput شغال دايماً لأن الـ input موجود في الـ DOM دايماً
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    const hasUnsavedChanges =
      title !== post?.title ||
      content !== post?.content ||
      file !== null ||
      removeMedia;

    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  // ✅ إضافة: force close بدون dialog — لما نضغط X بعد إيرور
  const handleForceClose = () => {
    setShowCancelDialog(false);
    onClose();
  };

  if (!post) return null;

  const hasChanges =
    title !== post.title ||
    content !== post.content ||
    file !== null ||
    removeMedia;

  return (
    <>
      <div className="edit-post-modal-overlay" onClick={handleClose}>
        <div className="edit-post-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('community.editPost')}</h2>
            <button className="close-btn" onClick={handleClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group">
              <label className="form-label">{t('community.postTitle')}</label>
              <input
                type="text"
                placeholder={t('community.postTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                maxLength="200"
                required
              />
            </div>

            {/* Content */}
            <div className="form-group">
              <label className="form-label">{t('community.postContent')}</label>
              <textarea
                placeholder={t('community.postContent')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-textarea"
                rows="5"
                required
              />
            </div>

            {/* Media */}
            <div className="form-group">
              <label className="form-label">{t('community.media')}</label>

              {/* ✅ Input مخفي دايماً في الـ DOM — مش جوه أي condition */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="file-upload-input"
                accept="image/*,video/*"
              />

              {/* Current media preview */}
              {currentMediaUrl && !removeMedia && !file && (
                <div className="current-media">
                  <div className="media-preview">
                    <img
                      src={getImageUrl(currentMediaUrl)}
                      alt="Current media"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="media-actions">
                      <button
                        type="button"
                        className="media-edit-btn"
                        onClick={triggerFileInput}
                        title={t('community.changeMedia')}
                      >
                        <FontAwesomeIcon icon={faImage} />
                        <span>Change</span>
                      </button>
                      <button
                        type="button"
                        className="media-delete-btn"
                        onClick={handleRemoveMedia}
                        title={t('community.removeMedia')}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Remove media indicator */}
              {removeMedia && (
                <div className="remove-media-indicator">
                  <span>🔄 {t('community.mediaWillBeRemoved')}</span>
                  <button type="button" className="undo-remove-btn" onClick={handleCancelRemoveMedia}>
                    {t('common.undo')}
                  </button>
                </div>
              )}

              {/* Upload area — لما مفيش ميديا أو اتمسحت */}
              {(!currentMediaUrl || removeMedia) && !file && (
                <div className="file-upload-wrapper">
                  <label className="file-upload-label" onClick={triggerFileInput}>
                    <FontAwesomeIcon icon={faUpload} className="upload-icon" />
                    <span>{t('community.uploadMedia')}</span>
                  </label>
                </div>
              )}

              {/* File selected preview */}
              {file && (
                <div className="file-selected">
                  <div className="file-info">
                    <FontAwesomeIcon icon={faImage} />
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => setFile(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              <small className="form-hint">{t('community.uploadHint')}</small>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={handleClose}>
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || !hasChanges}
              >
                {isSubmitting ? t('common.saving') : t('common.update')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Dialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleForceClose}
        title={t('dialog.discardChangesTitle')}
        message={t('dialog.discardChangesMessage')}
        confirmText={t('common.discard')}
        cancelText={t('common.keepEditing')}
        type="warning"
      />
    </>
  );
}
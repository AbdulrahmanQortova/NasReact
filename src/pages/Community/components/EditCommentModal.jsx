// src/pages/Community/components/EditCommentModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { postService } from '../../../services/postService';
import { useToast } from '../../../context/ToastContext';
import Dialog from '../../../components/ui/Dialog';
import './EditPostModal.css';

export default function EditCommentModal({ comment, onClose, onCommentUpdated }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (comment) {
      setContent(comment.content || '');
    }
  }, [comment]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error(t('community.fillAllFields'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await postService.updateComment(comment.id, { content });
      toast.success(t('community.commentUpdated'));

      if (onCommentUpdated) {
        onCommentUpdated({
          ...comment,
          ...response,
        });
      }

      onClose();
    } catch (error) {
      toast.error(error.message || t('community.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (content !== comment?.content) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  if (!comment) return null;

  const hasChanges = content !== comment.content;

  return (
    <>
      <div className="edit-post-modal-overlay" onClick={handleClose}>
        <div className="edit-post-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('community.editComment')}</h2>
            <button className="close-btn" onClick={handleClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('community.postContent')}</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-textarea"
                rows="4"
                required
                autoFocus
              />
            </div>

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
        onConfirm={() => { setShowCancelDialog(false); onClose(); }}
        title={t('dialog.discardChangesTitle')}
        message={t('dialog.discardChangesMessage')}
        confirmText={t('common.discard')}
        cancelText={t('common.keepEditing')}
        type="warning"
      />
    </>
  );
}
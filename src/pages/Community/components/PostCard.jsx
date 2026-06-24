// src/pages/Community/components/PostCard.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReportModal from './ReportModal';
import {
  faHeart,
  faComment,
  faShare,
  faEllipsisV,
  faEdit,
  faTrash,
  faFlag,
  faChevronDown,
  faChevronUp,
  faReply
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faRegHeart } from '@fortawesome/free-regular-svg-icons';
import { authService } from '../../../services/authService';
import { postService } from '../../../services/postService';
import { useToast } from '../../../context/ToastContext';
import Dialog from '../../../components/ui/Dialog';
import EditCommentModal from './EditCommentModal';
import './PostCard.css';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || 'https://localhost:7021/api';
  const baseWithoutApi = baseUrl.replace('/api', '');
  return url.startsWith('/') ? `${baseWithoutApi}${url}` : `${baseWithoutApi}/${url}`;
};

export default function PostCard({ post, index, onPostDeleted, onPostEdited, onPostUpdated, defaultShowComments = false }) {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
const [showReportModal, setShowReportModal] = useState(false);
  // Post state
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  // Comments state
const [showComments, setShowComments] = useState(defaultShowComments);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  // ✅ Comment menu — نحتاج نعرف مين مفتوح
  const [openCommentMenu, setOpenCommentMenu] = useState(null);

  // Dialog states
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Edit comment modal
  const [editingComment, setEditingComment] = useState(null);

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);

  const menuRef = useRef(null);
  const isLoggedIn = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
const isAuthor = currentUser?.id?.toLowerCase() === post.authorId?.toLowerCase();
const canEditPost = () => {
  if (!post.createdAt) return false;
  const normalized = post.createdAt.endsWith('Z') ? post.createdAt : post.createdAt + 'Z';
  const created = new Date(normalized);
  const diffHours = (new Date() - created) / (1000 * 60 * 60);
  return diffHours < 4;
};
const canEditComment = (c) => {
  if (!c.createdAt) return false;
  const normalized = c.createdAt.endsWith('Z') ? c.createdAt : c.createdAt + 'Z';
  const created = new Date(normalized);
  const diffHours = (new Date() - created) / (1000 * 60 * 60);
  return diffHours < 4;
};
  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikeCount(post.likeCount || 0);
  }, [post.id, post.isLiked, post.likeCount]);

  // Close post menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      // ✅ أغلق comment menus لو الضغطة برة
      if (!event.target.closest('.comment-menu')) {
        setOpenCommentMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
useEffect(() => {
  if (defaultShowComments) {
    loadComments(1, true);
  }
}, []);
  // ========== Like ==========
  const handleLike = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      const response = await postService.toggleLike(post.id);
      setIsLiked(response.liked);
      setLikeCount(prev => response.liked ? prev + 1 : prev - 1);
    } catch (error) {
      toast.error(t('community.likeError'));
    }
  };

  // ========== Comment ==========
  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await postService.addComment(post.id, {
        content: comment,
        parentCommentId: replyingTo?.id || null
      });
      setComment('');
      setReplyingTo(null);
      toast.success(t('community.commentAdded'));
      setCommentCount(prev => prev + 1);
      await loadComments(1, true);
      if (onPostUpdated) onPostUpdated({ ...post, commentCount: commentCount + 1 });
    } catch (error) {
      toast.error(t('community.commentError'));
    }
  };

  // ========== Load Comments ==========
  const loadComments = async (page = 1, reset = false) => {
    if (isLoadingComments) return;
    setIsLoadingComments(true);
    try {
      const response = await postService.getComments(post.id, page, 4);
      const data = response.data || response;
      const items = data.items || data || [];
      const totalPages = data.totalPages || 1;

      if (reset) {
        setComments(items);
      } else {
        setComments(prev => [...prev, ...items]);
      }

      setHasMoreComments(page < totalPages);
      setCommentPage(page);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadMoreComments = () => {
    if (hasMoreComments && !isLoadingComments) loadComments(commentPage + 1);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) loadComments(1, true);
  };

  // ========== Comment Like ==========
  const handleCommentLike = async (commentId) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      const response = await postService.toggleLikeComment(commentId);
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: response.liked,
            likeCount: response.liked ? (c.likeCount || 0) + 1 : (c.likeCount || 0) - 1
          };
        }
        // ✅ نتحقق كمان في الـ replies
        if (c.replies?.length) {
          return {
            ...c,
            replies: c.replies.map(r => r.id === commentId
              ? {
                  ...r,
                  isLiked: response.liked,
                  likeCount: response.liked ? (r.likeCount || 0) + 1 : (r.likeCount || 0) - 1
                }
              : r
            )
          };
        }
        return c;
      }));
    } catch (error) {
      toast.error(t('community.likeError'));
    }
  };

  // ========== Delete Comment ==========
  const requestDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setOpenCommentMenu(null);
    setShowDeleteCommentDialog(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await postService.deleteComment(commentToDelete);
      toast.success(t('community.commentDeleted'));
      setCommentCount(prev => prev - 1);
      await loadComments(1, true);
    } catch (error) {
      toast.error(t('community.deleteError'));
    } finally {
      setCommentToDelete(null);
    }
  };

  // ========== Edit Comment ==========
  const handleEditComment = (c) => {
    setOpenCommentMenu(null);
    setEditingComment(c);
  };

  const handleCommentUpdated = (updatedComment) => {
    setComments(prev => prev.map(c => {
      if (c.id === updatedComment.id) return { ...c, ...updatedComment };
      // ✅ نتحقق في الـ replies
      if (c.replies?.length) {
        return {
          ...c,
          replies: c.replies.map(r => r.id === updatedComment.id ? { ...r, ...updatedComment } : r)
        };
      }
      return c;
    }));
  };

  // ========== Delete Post ==========
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postService.deletePost(post.id);
      toast.success(t('community.postDeleted'));
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (error) {
      toast.error(t('community.deleteError'));
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onPostEdited) onPostEdited(post);
  };

const handleReport = () => {
  setShowMenu(false);
  setShowReportModal(true);
};
  const startReply = (c) => {
    setReplyingTo(c);
    document.getElementById(`comment-input-${post.id}`)?.focus();
  };

  const cancelReply = () => setReplyingTo(null);

const formatDate = (dateString) => {
  const normalized = dateString?.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(normalized);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};
  // ========== Render Comment ==========
  const renderComment = (c, isReply = false) => {
    const isCommentAuthor = currentUser?.id === c.authorId;
    const isMenuOpen = openCommentMenu === c.id;

    return (
      <div key={c.id} className={`comment-item ${isReply ? 'reply-item' : ''}`}>
        <div className="comment-author">
          <span className="comment-author-name">{c.authorName || 'Unknown'}</span>
          <div className="comment-author-right">
            <span className="comment-date">{formatDate(c.createdAt)}</span>

{isCommentAuthor && (
  <div className="comment-menu">
    <button className="comment-menu-trigger" onClick={() => setOpenCommentMenu(isMenuOpen ? null : c.id)}>
      <FontAwesomeIcon icon={faEllipsisV} />
    </button>
    {isMenuOpen && (
      <div className="comment-menu-dropdown">
        {canEditComment(c) ? (
          <button className="comment-menu-item edit" onClick={() => handleEditComment(c)}>
            <FontAwesomeIcon icon={faEdit} />
            <span>{t('common.edit')}</span>
          </button>
        ) : (
          <button
            className="comment-menu-item edit"
            disabled
            title="Can only edit within 4 hours"
            style={{ opacity: 0.4, cursor: 'not-allowed' }}
          >
            <FontAwesomeIcon icon={faEdit} />
            <span>{t('common.edit')}</span>
          </button>
        )}
        <button className="comment-menu-item delete" onClick={() => requestDeleteComment(c.id)}>
          <FontAwesomeIcon icon={faTrash} />
          <span>{t('common.delete')}</span>
        </button>
      </div>
    )}
  </div>
)}
          </div>
        </div>

        <p className="comment-content">{c.content}</p>

        <div className="comment-actions">
          <button
            className={`comment-like-btn ${c.isLiked ? 'liked' : ''}`}
            onClick={() => handleCommentLike(c.id)}
          >
            <FontAwesomeIcon icon={c.isLiked ? faHeart : faRegHeart} />
            <span>{c.likeCount || 0}</span>
          </button>
          {!isReply && (
            <button className="comment-reply-btn" onClick={() => startReply(c)}>
              <FontAwesomeIcon icon={faReply} />
              <span>Reply</span>
            </button>
          )}
        </div>

        {c.replies && c.replies.length > 0 && (
          <div className="replies-container">
            {c.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="post-card" style={{ animationDelay: `${(index % 3) * 0.1}s` }}>
        {/* ===== Post Header ===== */}
        <div className="post-header">
          <div className="post-author">
            <div className="author-avatar">
              {post.authorName?.charAt(0) || 'U'}
            </div>
            <div className="author-info">
              <span className="author-name">{post.authorName || 'Unknown'}</span>
              <span className="post-date">{formatDate(post.createdAt)}</span>
            </div>
          </div>

          <div className="post-menu" ref={menuRef}>
            <button
              className="menu-trigger"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            {showMenu && (
              <div className="menu-dropdown">
{isAuthor && (
  <>
    {canEditPost() ? (
      <button onClick={handleEdit} className="menu-item edit">
        <FontAwesomeIcon icon={faEdit} />
        <span>{t('common.edit')}</span>
      </button>
    ) : (
      <button
        className="menu-item edit"
        disabled
        title="Can only edit within 4 hours"
        style={{ opacity: 0.4, cursor: 'not-allowed' }}
      >
        <FontAwesomeIcon icon={faEdit} />
        <span>{t('common.edit')}</span>
      </button>
    )}
    <button
      onClick={() => { setShowMenu(false); setShowDeletePostDialog(true); }}
      className="menu-item delete"
      disabled={isDeleting}
    >
      <FontAwesomeIcon icon={faTrash} />
      <span>{isDeleting ? t('common.deleting') : t('common.delete')}</span>
    </button>
  </>
)}
                {!isAuthor && (
                  <button onClick={handleReport} className="menu-item report">
                    <FontAwesomeIcon icon={faFlag} />
                    <span>{t('common.report')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== Post Body ===== */}
        <div className="post-body">
          <h3 className="post-title">{post.title}</h3>
          <p className="post-content">{post.content}</p>
          {post.mediaUrl && (
            <div className="post-media">
              <img
                src={getImageUrl(post.mediaUrl)}
                alt="Post media"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'media-error';
                  errorDiv.textContent = '⚠️ Failed to load media';
                  parent.appendChild(errorDiv);
                }}
              />
            </div>
          )}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="post-hashtags">
              {post.hashtags.map(tag => (
                <span key={tag.id} className="hashtag">#{tag.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* ===== Post Actions ===== */}
        <div className="post-actions">
          <button className={`action-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <FontAwesomeIcon icon={isLiked ? faHeart : faRegHeart} />
            <span className="action-count">{likeCount}</span>
          </button>
          <button className="action-btn comment-btn" onClick={toggleComments}>
            <FontAwesomeIcon icon={faComment} />
            <span className="action-count">{commentCount}</span>
          </button>
          <button
            className="action-btn share-btn"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            <FontAwesomeIcon icon={faShare} />
          </button>
        </div>

        {/* ===== Comments Section ===== */}
        {showComments && (
          <div className="post-comments">
            {replyingTo && (
              <div className="reply-indicator">
                <span>Replying to <strong>{replyingTo.authorName}</strong></span>
                <button onClick={cancelReply}>✕</button>
              </div>
            )}

            {isLoggedIn && (
              <div className="comment-input-wrapper">
                <input
                  id={`comment-input-${post.id}`}
                  type="text"
                  placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : t('community.writeComment')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  className="comment-input"
                />
                <button className="comment-submit" onClick={handleComment}>
                  {t('community.send')}
                </button>
              </div>
            )}

            {isLoadingComments && comments.length === 0 ? (
              <div className="comments-loading">
                <div className="spinner-small"></div>
              </div>
            ) : (
              <div className="comments-list">
                {comments.map(c => renderComment(c))}
                {comments.length === 0 && (
                  <div className="no-comments">{t('community.noComments')}</div>
                )}
              </div>
            )}

            {hasMoreComments && comments.length > 0 && (
              <button className="load-more-comments" onClick={loadMoreComments} disabled={isLoadingComments}>
                {isLoadingComments ? (
                  <span>{t('common.loading')}</span>
                ) : (
                  <>{t('community.loadMoreComments')}<FontAwesomeIcon icon={faChevronDown} /></>
                )}
              </button>
            )}

            {!hasMoreComments && comments.length > 0 && (
              <div className="all-comments-loaded">
                <FontAwesomeIcon icon={faChevronUp} />
                <span>{t('community.allCommentsLoaded')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog
        isOpen={showDeletePostDialog}
        onClose={() => setShowDeletePostDialog(false)}
        onConfirm={handleDelete}
        title={t('dialog.deletePostTitle')}
        message={t('dialog.deletePostMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />

      <Dialog
        isOpen={showDeleteCommentDialog}
        onClose={() => { setShowDeleteCommentDialog(false); setCommentToDelete(null); }}
        onConfirm={confirmDeleteComment}
        title={t('dialog.deleteCommentTitle')}
        message={t('dialog.deleteCommentMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />

      {/* ✅ Edit Comment Modal */}
      {editingComment && (
        <EditCommentModal
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onCommentUpdated={handleCommentUpdated}
        />
      )}
      {showReportModal && (
  <ReportModal
    post={post}
    onClose={() => setShowReportModal(false)}
  />
)}
    </>
  );
}
// src/pages/Community/Community.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { postService } from '../../services/postService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import PostCard from './components/PostCard';
import CreatePost from './components/CreatePost';
import PostSkeleton from './components/PostSkeleton';
import EditPostModal from './components/EditPostModal'; 
import InfiniteScroll from '../../components/ui/InfiniteScroll';
import './Community.css';

export default function Community() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const isLoggedIn = authService.isAuthenticated();
  const isRTL = i18n.language === 'ar';
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [pageSize] = useState(6);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // ✅ Edit Modal state
  const [editingPost, setEditingPost] = useState(null);
  
  const isFetching = useRef(false);

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const fetchPosts = async (reset = false) => {
    if (isFetching.current) return;
    if (!reset && !hasMore) return;

    isFetching.current = true;
    
    if (reset) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const currentCursor = reset ? null : nextCursor;
      
      const response = await postService.getFeed({
        cursor: currentCursor,
        pageSize: pageSize,
      });

      const data = response.data || response;
      const items = data.data || data || [];
      const newCursor = data.pagination?.nextCursor || null;

      if (items.length === 0) {
        setHasMore(false);
        isFetching.current = false;
        setLoading(false);
        setInitialLoading(false);
        return;
      }

      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = items.filter(p => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      }

      setNextCursor(newCursor);
      setHasMore(!!newCursor);

    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message || t('community.error'));
      toast.error(err.message || t('community.error'));
    } finally {
      isFetching.current = false;
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !isFetching.current) {
      fetchPosts(false);
    }
  }, [loading, hasMore]);

  const handlePostCreated = () => {
    setShowCreatePost(false);
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchPosts(true);
    toast.success(t('community.postCreated'));
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  // ✅ Handle Edit - Open Modal
  const handlePostEdit = (post) => {
    setEditingPost(post);
  };

  // ✅ Handle Post Updated
  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    setEditingPost(null);
  };

  // ✅ Close Edit Modal
  const handleCloseEditModal = () => {
    setEditingPost(null);
  };

  if (initialLoading) {
    return (
      <div className="community-page" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="community-header">
          <div className="header-content">
            <h1>{t('community.title')}</h1>
            <p>{t('community.subtitle')}</p>
          </div>
        </div>
        <div className="community-posts">
          {[...Array(3)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="community-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="community-header">
        <div className="header-content">
          <h1>{t('community.title')}</h1>
          <p>{t('community.subtitle')}</p>
        </div>
        {isLoggedIn && (
          <button 
            className="create-post-btn"
            onClick={() => setShowCreatePost(!showCreatePost)}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{showCreatePost ? t('common.cancel') : t('community.createPost')}</span>
          </button>
        )}
      </div>

      {showCreatePost && (
        <CreatePost onPostCreated={handlePostCreated} onCancel={() => setShowCreatePost(false)} />
      )}

      {error && (
        <div className="community-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button onClick={() => fetchPosts(true)} className="retry-btn">{t('common.retry')}</button>
        </div>
      )}

      {posts.length === 0 && !error ? (
        <div className="community-empty">
          <div className="empty-icon">💬</div>
          <h3>{t('community.noPosts')}</h3>
          <p>{t('community.beFirst')}</p>
          {isLoggedIn && (
            <button className="create-first-btn" onClick={() => setShowCreatePost(true)}>
              {t('community.createFirstPost')}
            </button>
          )}
        </div>
      ) : (
        <InfiniteScroll
          hasMore={hasMore}
          loading={loading}
          onLoadMore={loadMore}
          endMessage={<span>{t('community.noMorePosts')}</span>}
        >
          <div className="community-posts">
            {posts.map((post, index) => (
              <PostCard 
                key={post.id} 
                post={post} 
                index={index}
                onPostDeleted={handlePostDeleted}
                onPostEdited={handlePostEdit} // ✅ Pass edit handler
                onPostUpdated={handlePostUpdated}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}

      {/* ✅ Edit Modal - Outside the posts loop */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={handleCloseEditModal}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { postService } from '../../services/postService';
import PostCard from './components/PostCard';
import PostSkeleton from './components/PostSkeleton';
import './Community.css';

export default function SinglePost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await postService.getPostById(postId);
        const data = response.data || response;
        setPost(data);
      } catch (err) {
        setError(t('community.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="community-page" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="single-post-back">
          <button className="back-btn" onClick={() => navigate('/community')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>{t('common.back')}</span>
          </button>
        </div>
        <PostSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="community-page" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="single-post-back">
          <button className="back-btn" onClick={() => navigate('/community')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>{t('common.back')}</span>
          </button>
        </div>
        <div className="community-error">
          <span className="error-icon">⚠️</span>
          <span>{error || t('community.error')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="community-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="single-post-back">
        <button className="back-btn" onClick={() => navigate('/community')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>{t('common.back')}</span>
        </button>
      </div>

      <PostCard
        post={post}
        index={0}
        defaultShowComments={true}
        onPostDeleted={() => navigate('/community')}
      />
    </div>
  );
}
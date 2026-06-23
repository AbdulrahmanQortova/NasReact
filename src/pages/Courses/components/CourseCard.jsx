// src/pages/Courses/components/CourseCard.jsx
import { useTranslation } from 'react-i18next';
import { authService } from '../../../services/authService';

export default function CourseCard({ course, topicName, onRate, onView, onEnroll, onUnenroll, index }) {
  const { t, i18n } = useTranslation();
  const isLoggedIn = authService.isAuthenticated();
  const isStudent = authService.isStudent();
  const isAdmin = authService.isAdmin();
  const isEnrolled = course.isEnrolled || false;
  const isRTL = i18n.language === 'ar';

  const getLevelName = (level) => {
    const levelMap = {
      0: t('courses.level.beginner'),
      1: t('courses.level.intermediate'),
      2: t('courses.level.advanced')
    };
    return levelMap[level] || t('courses.level.beginner');
  };

  const getImageUrl = (thumbnailUrl) => {
    if (!thumbnailUrl) return null;
    if (thumbnailUrl.startsWith('/')) {
      return `https://localhost:7021${thumbnailUrl}`;
    }
    return thumbnailUrl;
  };

  const getLevelColor = (level) => {
    const levelName = getLevelName(level);
    switch (levelName) {
      case t('courses.level.beginner'): return 'level-beginner';
      case t('courses.level.intermediate'): return 'level-intermediate';
      case t('courses.level.advanced'): return 'level-advanced';
      default: return 'level-beginner';
    }
  };

  const renderStars = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="star half">½</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return t('courses.free');
    if (numPrice <= 0) return t('courses.free');
    return `$${numPrice.toFixed(2)}`;
  };

  const handleEnroll = () => {
    if (onEnroll) {
      onEnroll(course.id);
    }
  };

  const handleUnenroll = () => {
    if (onUnenroll) {
      onUnenroll(course.id);
    }
  };

  return (
    <div 
      className="course-card fade-in-up" 
      style={{ animationDelay: `${(index % 6) * 0.1}s` }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="course-card-image">
        {course.thumbnailUrl ? (
          <img 
            src={getImageUrl(course.thumbnailUrl)} 
            alt={course.title}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="course-card-image-placeholder">📚</div>';
            }}
          />
        ) : (
          <div className="course-card-image-placeholder">📚</div>
        )}
        <span className={`course-level ${getLevelColor(course.level)}`}>
          {getLevelName(course.level)}
        </span>
        {topicName && <span className="course-topic">{topicName}</span>}
      </div>

      <div className="course-card-content">
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-description">
          {course.description?.substring(0, 100)}
          {course.description?.length > 100 ? '...' : ''}
        </p>
        
        <div className="course-card-meta">
          <div className="course-rating">
            {renderStars(course.averageRating)}
            <span className="rating-value">({course.totalRatings || 0})</span>
          </div>
          <div className="course-duration">
            ⏱️ {course.durationInMinutes} {t('courses.duration')}
          </div>
        </div>

        <div className="course-price">
          <span className={course.price > 0 ? "price-value" : "price-free"}>
            {formatPrice(course.price)}
          </span>
        </div>
      </div>

      <div className="course-card-actions">
        <button className="view-btn" onClick={() => onView(course)}>
          {t('courses.viewCourse')}
        </button>
        
        {isLoggedIn && !isEnrolled && (
          <button className="enroll-btn" onClick={handleEnroll}>
            {t('courses.enrollNow')}
          </button>
        )}
        
        {isLoggedIn && isEnrolled && (
          <button className="enrolled-btn" onClick={handleUnenroll}>
            ✓ {t('courses.enrolled')}
          </button>
        )}
      </div>
    </div>
  );
}
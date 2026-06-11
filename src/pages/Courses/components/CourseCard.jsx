// src/pages/Courses/components/CourseCard.jsx
import { authService } from '../../../services/authService';

export default function CourseCard({ course, topicName, onRate, onDelete, onView }) {
  const isAdmin = authService.isAdmin();
  const isStudent = authService.isStudent();

  // دالة لتحويل رقم المستوى إلى نص
  const getLevelName = (level) => {
    const levelMap = {
      0: 'Beginner',
      1: 'Intermediate',
      2: 'Advanced'
    };
    return levelMap[level] || 'Beginner';
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
      case 'Beginner': return 'level-beginner';
      case 'Intermediate': return 'level-intermediate';
      case 'Advanced': return 'level-advanced';
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

  // ✅ دالة لتنسيق عرض السعر
  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return 'Free';
    if (numPrice <= 0) return 'Free';
    return `$${numPrice.toFixed(2)}`;
  };

  return (
    <div className="course-card">
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
            ⏱️ {course.durationInMinutes} min
          </div>
        </div>

        {/* ✅ عرض السعر بشكل صحيح */}
        <div className="course-price">
          <span className={course.price > 0 ? "price-value" : "price-free"}>
            {formatPrice(course.price)}
          </span>
        </div>
      </div>

      <div className="course-card-actions">
        <button className="primary-btn" onClick={() => onView(course)}>
          View Course
        </button>
        
        {isStudent && (
          <button className="secondary-btn" onClick={() => onRate(course)}>
            ⭐ Rate
          </button>
        )}
        
        {isAdmin && (
          <button className="danger-btn" onClick={() => onDelete(course.id)}>
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
}
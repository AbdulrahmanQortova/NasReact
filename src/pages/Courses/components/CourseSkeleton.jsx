// src/pages/Courses/components/CourseSkeleton.jsx
import './CourseSkeleton.css';

export default function CourseSkeleton() {
  return (
    <div className="course-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-description"></div>
        <div className="skeleton-meta">
          <div className="skeleton-rating"></div>
          <div className="skeleton-duration"></div>
        </div>
        <div className="skeleton-price"></div>
        <div className="skeleton-actions">
          <div className="skeleton-btn"></div>
          <div className="skeleton-btn"></div>
        </div>
      </div>
    </div>
  );
}
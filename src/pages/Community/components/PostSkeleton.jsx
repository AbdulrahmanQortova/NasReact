// src/pages/Community/components/PostSkeleton.jsx
import './PostSkeleton.css';

export default function PostSkeleton() {
  return (
    <div className="post-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-author">
          <div className="skeleton-line skeleton-name"></div>
          <div className="skeleton-line skeleton-date"></div>
        </div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-content"></div>
        <div className="skeleton-line skeleton-content"></div>
        <div className="skeleton-line skeleton-content short"></div>
      </div>
      <div className="skeleton-actions">
        <div className="skeleton-action"></div>
        <div className="skeleton-action"></div>
        <div className="skeleton-action"></div>
      </div>
    </div>
  );
}
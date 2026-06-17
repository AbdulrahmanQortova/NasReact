// src/pages/Courses/components/RatingModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './RatingModal.css'; // ✅ أضف هذا السطر

export default function RatingModal({ course, onClose, onSubmit, initialRating = 5, initialReview = '' }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialReview);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(initialRating);
    setComment(initialReview);
  }, [initialRating, initialReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarInput = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`star-input ${i <= (hoverRating || rating) ? 'active' : ''}`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialReview ? t('rating.update') : t('rating.rate')} "{course?.title}"</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rating-input-group">
            <label>{t('rating.yourRating')}</label>
            <div className="star-inputs">
              {renderStarInput()}
            </div>
            <span className="rating-label">
              {rating === 5 && t('rating.excellent')}
              {rating === 4 && t('rating.veryGood')}
              {rating === 3 && t('rating.good')}
              {rating === 2 && t('rating.fair')}
              {rating === 1 && t('rating.poor')}
            </span>
          </div>

          <div className="comment-input-group">
            <label>{t('rating.review')}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('rating.reviewPlaceholder')}
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? t('common.saving') : (initialReview ? t('rating.update') : t('rating.submit'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
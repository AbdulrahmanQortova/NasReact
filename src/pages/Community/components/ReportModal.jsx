import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFlag } from '@fortawesome/free-solid-svg-icons';
import { postService } from '../../../services/postService';
import { useToast } from '../../../context/ToastContext';
import './ReportModal.css';

const REPORT_REASONS = [
  { value: 'Spam',           labelKey: 'report.spam' },
  { value: 'Inappropriate',  labelKey: 'report.inappropriate' },
  { value: 'Harassment',     labelKey: 'report.harassment' },
  { value: 'FakeInformation',labelKey: 'report.fakeInfo' },
  { value: 'Other',          labelKey: 'report.other' },
];

export default function ReportModal({ post, onClose }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t('report.selectReason'));
      return;
    }

    setIsSubmitting(true);
    try {
      await postService.reportPost(post.id, { reason, details });
      toast.success(t('report.success'));
      onClose();
    } catch (err) {
      toast.error(t('report.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-icon-wrap">
              <FontAwesomeIcon icon={faFlag} />
            </div>
            <div>
              <h3 className="report-title">{t('report.title')}</h3>
              <p className="report-subtitle">{t('report.subtitle')}</p>
            </div>
          </div>
          <button className="report-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Post preview */}
        <div className="report-post-preview">
          <p className="report-post-title">{post.title}</p>
          <p className="report-post-content">
            {post.content?.length > 100 ? post.content.slice(0, 100) + '…' : post.content}
          </p>
        </div>

        {/* Reason pills */}
        <div className="report-section">
          <label className="report-label">{t('report.reasonLabel')}</label>
          <div className="report-reasons">
            {REPORT_REASONS.map(r => (
              <button
                key={r.value}
                className={`report-reason-btn ${reason === r.value ? 'selected' : ''}`}
                onClick={() => setReason(r.value)}
                type="button"
              >
                {t(r.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="report-section">
          <label className="report-label">{t('report.detailsLabel')}</label>
          <textarea
            className="report-textarea"
            placeholder={t('report.detailsPlaceholder')}
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <span className="report-char-count">{details.length}/500</span>
        </div>

        {/* Actions */}
        <div className="report-actions">
          <button className="report-cancel-btn" onClick={onClose} type="button">
            {t('common.cancel')}
          </button>
          <button
            className="report-submit-btn"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            type="button"
          >
            {isSubmitting ? t('report.submitting') : t('report.submit')}
          </button>
        </div>

      </div>
    </div>
  );
}
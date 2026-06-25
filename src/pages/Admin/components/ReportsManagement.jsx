import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag, faEye, faTrash, faCheck, faTimes,
  faFilter, faExternalLinkAlt, faSpinner, faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import './ReportsManagement.css';

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Dismissed'];

const STATUS_COLORS = {
  Pending:   { bg: 'rgba(210,153,34,0.12)',  color: '#d29922' },
  Approved:  { bg: 'rgba(63,185,80,0.12)',   color: '#3fb950' },
  Dismissed: { bg: 'rgba(139,148,158,0.12)', color: '#8b949e' },
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const normalized = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(normalized));
};

export default function ReportsManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedReport, setExpandedReport] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [sortBy, setSortBy] = useState('newest');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter !== 'All' ? `?status=${statusFilter}` : '';
      const data = await api.get(`/posts/reports${query}`);
      setReports(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('admin.reports.loadError'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── Group by postId ──────────────────────────────────────────
  const grouped = reports.reduce((acc, r) => {
    const key = r.postId;
    if (!acc[key]) acc[key] = { postId: key, postTitle: r.postTitle, reports: [] };
    acc[key].reports.push(r);
    return acc;
  }, {});

  const groupedList = Object.values(grouped).sort((a, b) => {
    if (sortBy === 'most') return b.reports.length - a.reports.length;
    const latestA = Math.max(...a.reports.map(r => new Date(r.createdAt)));
    const latestB = Math.max(...b.reports.map(r => new Date(r.createdAt)));
    return latestB - latestA;
  });

  // ── Review ───────────────────────────────────────────────────
  const handleReview = async (reportId, action) => {
    setReviewingId(reportId);
    try {
      await api.post(`/posts/reports/${reportId}/review`, {
        action,
        adminNotes: adminNotes[reportId] || ''
      });
      toast.success(t('admin.reports.reviewSuccess'));
      setAdminNotes(prev => { const n = { ...prev }; delete n[reportId]; return n; });
      fetchReports();
    } catch {
      toast.error(t('admin.reports.reviewError'));
    } finally {
      setReviewingId(null);
    }
  };

  // ── Delete post ──────────────────────────────────────────────
  const handleDeletePost = async (postId) => {
    if (!window.confirm(t('admin.reports.confirmDelete'))) return;
    setDeletingId(postId);
    try {
      await api.delete(`/posts/admin/${postId}`);
      toast.success(t('admin.reports.deleteSuccess'));
      fetchReports();
    } catch {
      toast.error(t('admin.reports.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Stats ────────────────────────────────────────────────────
  const stats = {
    total:     reports.length,
    pending:   reports.filter(r => r.status === 'Pending').length,
    approved:  reports.filter(r => r.status === 'Approved').length,
    dismissed: reports.filter(r => r.status === 'Dismissed').length,
  };

  return (
    <div className="reports-management">

      {/* Stats row */}
      <div className="reports-stats">
        {[
          { label: t('admin.reports.total'),     value: stats.total,     color: 'var(--primary)' },
          { label: t('admin.reports.pending'),   value: stats.pending,   color: '#d29922' },
          { label: t('admin.reports.approved'),  value: stats.approved,  color: '#3fb950' },
          { label: t('admin.reports.dismissed'), value: stats.dismissed, color: '#8b949e' },
        ].map(s => (
          <div key={s.label} className="reports-stat-card">
            <span className="reports-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="reports-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="reports-toolbar">
        <div className="reports-filters">
          <FontAwesomeIcon icon={faFilter} className="filter-icon" />
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`reports-filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {t(`admin.reports.status${s}`)}
              {s !== 'All' && (
                <span className="filter-count">
                  {s === 'Pending' ? stats.pending : s === 'Approved' ? stats.approved : stats.dismissed}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="reports-sort">
          <label>{t('admin.reports.sortBy')}</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">{t('admin.reports.sortNewest')}</option>
            <option value="most">{t('admin.reports.sortMost')}</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="reports-loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>{t('common.loading')}</span>
        </div>
      ) : groupedList.length === 0 ? (
        <div className="reports-empty">
          <FontAwesomeIcon icon={faFlag} className="reports-empty-icon" />
          <p>{t('admin.reports.noReports')}</p>
        </div>
      ) : (
        <div className="reports-list">
          {groupedList.map(group => (
            <div key={group.postId} className="report-group">

              {/* Group header */}
              <div className="report-group-header">
                <div className="report-group-info">
                  <div className="report-group-badge">{group.reports.length}</div>
                  <div>
                    <h3 className="report-group-title">{group.postTitle}</h3>
                    <span className="report-group-sub">
                      {t('admin.reports.reportsCount', { count: group.reports.length })}
                    </span>
                  </div>
                </div>
                <div className="report-group-actions">
                  <button
                    className="rg-btn view"
                    onClick={() => navigate(`/community/post/${group.postId}`)}
                    title={t('admin.reports.viewPost')}
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                    <span>{t('admin.reports.viewPost')}</span>
                  </button>
                  <button
                    className="rg-btn delete"
                    onClick={() => handleDeletePost(group.postId)}
                    disabled={deletingId === group.postId}
                    title={t('admin.reports.deletePost')}
                  >
                    {deletingId === group.postId
                      ? <FontAwesomeIcon icon={faSpinner} spin />
                      : <FontAwesomeIcon icon={faTrash} />}
                    <span>{t('admin.reports.deletePost')}</span>
                  </button>
                  <button
                    className="rg-btn expand"
                    onClick={() => setExpandedReport(expandedReport === group.postId ? null : group.postId)}
                  >
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      style={{ transform: expandedReport === group.postId ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                    />
                  </button>
                </div>
              </div>

              {/* Individual reports */}
              {expandedReport === group.postId && (
                <div className="report-items">
                  {group.reports.map(report => (
                    <div key={report.id} className="report-item">
                      <div className="report-item-top">
                        <div className="report-item-meta">
                          <span className="report-reporter">
                            <strong>{report.reporterName}</strong>
                          </span>
                          <span
                            className="report-status-badge"
                            style={STATUS_COLORS[report.status] || {}}
                          >
                            {report.status}
                          </span>
                          <span className="report-date">{formatDate(report.createdAt)}</span>
                        </div>
                      </div>

                      <div className="report-reason-row">
                        <span className="report-reason-label">{t('admin.reports.reason')}:</span>
                        <span className="report-reason-value">{report.reason}</span>
                      </div>

                      {report.details && (
                        <p className="report-details">"{report.details}"</p>
                      )}

                      {report.adminNotes && (
                        <p className="report-admin-notes">
                          <strong>{t('admin.reports.adminNotes')}:</strong> {report.adminNotes}
                        </p>
                      )}

                      {report.reviewedByAdmin && (
                        <p className="report-reviewed-by">
                          {t('admin.reports.reviewedBy')} <strong>{report.reviewedByAdmin}</strong>
                          {report.reviewedAt && ` · ${formatDate(report.reviewedAt)}`}
                        </p>
                      )}

                      {/* Review actions - only for Pending */}
                      {report.status === 'Pending' && (
                        <div className="report-review-section">
                          <input
                            className="report-notes-input"
                            placeholder={t('admin.reports.addNotes')}
                            value={adminNotes[report.id] || ''}
                            onChange={e => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                          />
                          <div className="report-review-btns">
                            <button
                              className="review-btn approve"
                              onClick={() => handleReview(report.id, 'Approve')}
                              disabled={reviewingId === report.id}
                            >
                              {reviewingId === report.id
                                ? <FontAwesomeIcon icon={faSpinner} spin />
                                : <FontAwesomeIcon icon={faCheck} />}
                              {t('admin.reports.approve')}
                            </button>
                            <button
                              className="review-btn dismiss"
                              onClick={() => handleReview(report.id, 'Dismiss')}
                              disabled={reviewingId === report.id}
                            >
                              {reviewingId === report.id
                                ? <FontAwesomeIcon icon={faSpinner} spin />
                                : <FontAwesomeIcon icon={faTimes} />}
                              {t('admin.reports.dismiss')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
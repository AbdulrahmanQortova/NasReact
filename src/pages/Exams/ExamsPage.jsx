import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList, faClock, faStar, faPlay,
  faCheckCircle, faSpinner, faLock
} from '@fortawesome/free-solid-svg-icons';
import { examService } from '../../services/examService';
import { useToast } from '../../context/ToastContext';
import './ExamsPage.css';

export default function ExamsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const isRTL = i18n.language === 'ar';

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      // جيب الـ standalone exams فقط (مش تابعة لكورس)
      const data = await examService.getStandaloneExams();
      const items = Array.isArray(data) ? data : data?.data || data?.items || [];
      setExams(items);
    } catch (err) {
      toast.error(t('exams.loadError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="exams-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="exams-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="exams-header">
        <div>
          <h1>{t('exams.title')}</h1>
          <p>{t('exams.subtitle')}</p>
        </div>
        <div className="exams-count-badge">
          <FontAwesomeIcon icon={faClipboardList} />
          <span>{exams.length} {t('exams.available')}</span>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="exams-empty">
          <FontAwesomeIcon icon={faClipboardList} className="exams-empty-icon" />
          <h3>{t('exams.noExams')}</h3>
          <p>{t('exams.noExamsDesc')}</p>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map(exam => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onStart={() => {
                if (exam.canTakeExam === false) return;
                navigate(`/exams/${exam.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatRetryDate(dateStr, locale) {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateStr));
}

function ExamCard({ exam, onStart }) {
  const { t, i18n } = useTranslation();
  const canTake = exam.canTakeExam !== false;
  const maxAttempts = exam.maxAttempts ?? 3;
  const usedAttempts = exam.usedAttempts ?? 0;
  const remainingAttempts = exam.remainingAttempts ?? Math.max(0, maxAttempts - usedAttempts);
  const resetDays = exam.attemptResetPeriodDays ?? 30;
  const retryDate = formatRetryDate(exam.nextAttemptAvailableAt, i18n.language);

  return (
    <div className={`exam-card ${!canTake ? 'exam-card-locked' : ''}`}>
      <div className="exam-card-header">
        <div className="exam-card-icon">
          <FontAwesomeIcon icon={faClipboardList} />
        </div>
        <div className="exam-card-meta">
          <div className="exam-meta-item">
            <FontAwesomeIcon icon={faClock} />
            <span>{exam.durationInMinutes} {t('exams.minutes')}</span>
          </div>
          <div className="exam-meta-item">
            <FontAwesomeIcon icon={faStar} />
            <span>{exam.passingScore}% {t('exams.toPass')}</span>
          </div>
        </div>
      </div>

      <div className="exam-card-body">
        <h3 className="exam-card-title">{exam.title}</h3>
        {exam.description && (
          <p className="exam-card-desc">{exam.description}</p>
        )}
        <div className="exam-card-stats">
          <span className="exam-stat">
            <FontAwesomeIcon icon={faClipboardList} />
            {exam.questionCount ?? 0} {t('exams.questions')}
          </span>
          <span className="exam-stat">
            <FontAwesomeIcon icon={faLock} />
            {t('exams.attemptsUsed', { used: usedAttempts, max: maxAttempts, days: resetDays })}
          </span>
        </div>

        {!canTake ? (
          <div className="exam-attempt-warning">
            <FontAwesomeIcon icon={faLock} />
            <div>
              <strong>{t('exams.maxAttemptsReached')}</strong>
              {retryDate && (
                <p>{t('exams.retryAfter', { date: retryDate })}</p>
              )}
              <p className="exam-reset-note">{t('exams.attemptsResetInfo')}</p>
            </div>
          </div>
        ) : remainingAttempts < maxAttempts && (
          <div className="exam-attempt-info">
            <span>{t('exams.attemptsRemaining', { remaining: remainingAttempts })}</span>
            <span className="exam-reset-note">{t('exams.attemptsResetInfo')}</span>
          </div>
        )}
      </div>

      <div className="exam-card-footer">
        <button
          className="exam-start-btn"
          onClick={onStart}
          disabled={!canTake}
          title={!canTake ? t('exams.cannotStartExam') : undefined}
        >
          <FontAwesomeIcon icon={canTake ? faPlay : faLock} />
          {canTake ? t('exams.startExam') : t('exams.noAttemptsLeft')}
        </button>
      </div>
    </div>
  );
}
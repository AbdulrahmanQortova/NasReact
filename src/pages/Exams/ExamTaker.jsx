import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock, faChevronLeft, faChevronRight,
  faCheckCircle, faSpinner, faArrowLeft, faLock
} from '@fortawesome/free-solid-svg-icons';
import { examService } from '../../services/examService';
import { useToast } from '../../context/ToastContext';
import Dialog from '../../components/ui/Dialog';
import './ExamTaker.css';

export default function ExamTaker() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const isRTL = i18n.language === 'ar';
  const timerRef = useRef(null);

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: answerId | answerId[] | text }
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);
  const [showUnansweredDialog, setShowUnansweredDialog] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);

  useEffect(() => {
    loadExam();
    return () => clearInterval(timerRef.current);
  }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    try {
      const [examData, questionsData] = await Promise.all([
        examService.getExamById(examId),
        examService.getQuestionsByExam(examId),
      ]);

      const e = examData?.data || examData;
      setExam(e);
      setTimeLeft((e.durationInMinutes || 30) * 60);

      // load answers per question
      const qs = Array.isArray(questionsData) ? questionsData : questionsData?.data || [];
      const qsWithAnswers = await Promise.all(
        qs.map(async (q) => {
          try {
            const ans = await examService.getAnswersByQuestion(q.id);
            return { ...q, answers: Array.isArray(ans) ? ans : ans?.data || [] };
          } catch {
            return { ...q, answers: [] };
          }
        })
      );
      setQuestions(qsWithAnswers);
    } catch (err) {
      toast.error(t('exams.loadError'));
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    setStarted(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswer = (questionId, answerId, type) => {
    setAnswers(prev => {
      if (type === 'MultipleAnswer') {
        const curr = prev[questionId] || [];
        return {
          ...prev,
          [questionId]: curr.includes(answerId)
            ? curr.filter(id => id !== answerId)
            : [...curr, answerId],
        };
      }
      return { ...prev, [questionId]: answerId };
    });
  };

  const handleTextAnswer = (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async (auto = false) => {
    if (!auto) {
      const unanswered = questions.filter(q => !answers[q.id]);
      if (unanswered.length > 0) {
        setUnansweredCount(unanswered.length);
        setShowUnansweredDialog(true);
        return;
      }
    }

    clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const payload = {
        answers: questions.map(q => ({
          questionId: q.id,
          selectedAnswerIds: Array.isArray(answers[q.id])
            ? answers[q.id]
            : answers[q.id] && q.type !== 'Text'
            ? [answers[q.id]]
            : [],
          textAnswer: q.type === 'Text' ? (answers[q.id] || '') : null,
        })),
      };

      const res = await examService.submitExam(examId, payload);
      setResult(res?.data || res);
    } catch (err) {
      toast.error(err.message || t('exams.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatRetryDate = (dateStr) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  };

  const canTakeExam = exam?.canTakeExam !== false;
  const maxAttempts = exam?.maxAttempts ?? 3;
  const usedAttempts = exam?.usedAttempts ?? 0;
  const remainingAttempts = exam?.remainingAttempts ?? Math.max(0, maxAttempts - usedAttempts);
  const resetDays = exam?.attemptResetPeriodDays ?? 30;
  const retryDate = formatRetryDate(exam?.nextAttemptAvailableAt);

  if (loading) {
    return (
      <div className="exam-taker-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  // ── Result screen ────────────────────────────────────────────
  if (result) {
    const passed = result.score >= (exam?.passingScore || 60);
    return (
      <div className="exam-result" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="result-card">
          <div className={`result-icon ${passed ? 'pass' : 'fail'}`}>
            {passed ? '🎉' : '😔'}
          </div>
          <h2>{passed ? t('exams.passed') : t('exams.failed')}</h2>
          <div className="result-score">
            <span className="score-value" style={{ color: passed ? 'var(--green)' : 'var(--red)' }}>
              {result.score?.toFixed(1)}%
            </span>
            <span className="score-label">{t('exams.yourScore')}</span>
          </div>
          <div className="result-stats">
            <div className="result-stat">
              <span>{result.correctAnswers ?? '-'}</span>
              <small>{t('exams.correct')}</small>
            </div>
            <div className="result-stat">
              <span>{result.totalQuestions ?? questions.length}</span>
              <small>{t('exams.total')}</small>
            </div>
            <div className="result-stat">
              <span>{exam?.passingScore}%</span>
              <small>{t('exams.passing')}</small>
            </div>
          </div>
          <div className="result-actions">
            <button className="result-btn primary" onClick={() => navigate('/exams')}>
              {t('exams.backToExams')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Blocked screen (max attempts) ───────────────────────────
  if (!loading && exam && !canTakeExam) {
    return (
      <div className="exam-intro" dir={isRTL ? 'rtl' : 'ltr'}>
        <button className="exam-back-btn" onClick={() => navigate('/exams')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t('common.back')}
        </button>
        <div className="exam-intro-card exam-blocked-card">
          <div className="exam-blocked-icon">
            <FontAwesomeIcon icon={faLock} />
          </div>
          <h1>{exam.title}</h1>
          <p className="exam-blocked-title">{t('exams.maxAttemptsReached')}</p>
          <p className="exam-blocked-desc">
            {t('exams.attemptsUsed', { used: usedAttempts, max: maxAttempts, days: resetDays })}
          </p>
          {retryDate && (
            <p className="exam-blocked-retry">{t('exams.retryAfter', { date: retryDate })}</p>
          )}
          <p className="exam-reset-note">{t('exams.attemptsResetInfo')}</p>
          <button className="exam-start-btn-large" onClick={() => navigate('/exams')}>
            {t('exams.backToExams')}
          </button>
        </div>
      </div>
    );
  }

  // ── Intro screen ─────────────────────────────────────────────
  if (!started) {
    return (
      <div className="exam-intro" dir={isRTL ? 'rtl' : 'ltr'}>
        <button className="exam-back-btn" onClick={() => navigate('/exams')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t('common.back')}
        </button>
        <div className="exam-intro-card">
          <h1>{exam?.title}</h1>
          {exam?.description && <p className="exam-intro-desc">{exam.description}</p>}
          <div className="exam-intro-info">
            <div className="intro-info-item">
              <FontAwesomeIcon icon={faClock} />
              <div>
                <strong>{exam?.durationInMinutes} {t('exams.minutes')}</strong>
                <small>{t('exams.duration')}</small>
              </div>
            </div>
            <div className="intro-info-item">
              <FontAwesomeIcon icon={faCheckCircle} />
              <div>
                <strong>{questions.length}</strong>
                <small>{t('exams.questions')}</small>
              </div>
            </div>
            <div className="intro-info-item">
              <span style={{ fontSize: 20 }}>🏆</span>
              <div>
                <strong>{exam?.passingScore}%</strong>
                <small>{t('exams.passingScore')}</small>
              </div>
            </div>
            <div className="intro-info-item">
              <FontAwesomeIcon icon={faLock} />
              <div>
                <strong>{remainingAttempts}/{maxAttempts}</strong>
                <small>{t('exams.attemptsRemaining', { remaining: remainingAttempts })}</small>
              </div>
            </div>
          </div>
          <p className="exam-reset-note">{t('exams.attemptsResetInfo')}</p>
          <button className="exam-start-btn-large" onClick={startExam} disabled={!canTakeExam}>
            {t('exams.startExam')}
          </button>
        </div>
      </div>
    );
  }

  // ── Exam screen ──────────────────────────────────────────────
  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const timerWarning = timeLeft < 120;

  return (
    <div className="exam-taker" dir={isRTL ? 'rtl' : 'ltr'}>
      <Dialog
        isOpen={showUnansweredDialog}
        onClose={() => setShowUnansweredDialog(false)}
        onConfirm={() => {
          setShowUnansweredDialog(false);
          clearInterval(timerRef.current);
          setSubmitting(true);
          handleSubmit(true);
        }}
        type="warning"
        title={t('exams.unansweredTitle') || 'Unanswered Questions'}
        message={`${unansweredCount} ${t('exams.unansweredWarning')}`}
        confirmText={t('exams.submitAnyway') || 'Submit Anyway'}
        cancelText={t('common.cancel')}
      />

      {/* Top bar */}
      <div className="exam-topbar">
        <div className="exam-topbar-left">
          <span className="exam-topbar-title">{exam?.title}</span>
          <span className="exam-progress-text">
            {answeredCount}/{questions.length} {t('exams.answered')}
          </span>
        </div>
        <div className={`exam-timer ${timerWarning ? 'warning' : ''}`}>
          <FontAwesomeIcon icon={faClock} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="exam-progress-bar">
        <div
          className="exam-progress-fill"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="exam-body">
        <div className="question-card">
          <div className="question-header">
            <span className="question-num">
              {t('exams.question')} {currentQ + 1} / {questions.length}
            </span>
            <span className="question-points">{q.points} {t('exams.pts')}</span>
          </div>
          <p className="question-text">{q.text}</p>

          {/* Answers */}
          {q.type === 'Text' ? (
            <textarea
              className="text-answer"
              placeholder={t('exams.typeAnswer')}
              value={answers[q.id] || ''}
              onChange={e => handleTextAnswer(q.id, e.target.value)}
              rows={4}
            />
          ) : (
            <div className="answer-options">
              {q.answers.map(ans => {
                const isSelected = q.type === 'MultipleAnswer'
                  ? (answers[q.id] || []).includes(ans.id)
                  : answers[q.id] === ans.id;
                return (
                  <button
                    key={ans.id}
                    className={`answer-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAnswer(q.id, ans.id, q.type)}
                  >
                    <span className="answer-bullet" />
                    {ans.text}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="exam-nav">
          <button
            className="exam-nav-btn"
            onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
            disabled={currentQ === 0}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            {t('common.previous')}
          </button>

          {isLast ? (
            <button
              className="exam-submit-btn"
              onClick={() => handleSubmit()}
              disabled={submitting}
            >
              {submitting
                ? <FontAwesomeIcon icon={faSpinner} spin />
                : <FontAwesomeIcon icon={faCheckCircle} />}
              {t('exams.submit')}
            </button>
          ) : (
            <button
              className="exam-nav-btn next"
              onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}
            >
              {t('common.next')}
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
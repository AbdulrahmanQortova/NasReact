// src/pages/Admin/components/Question/ExamQuestionsManager.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { examService } from '../../../../services/examService';
import { useToast } from '../../../../context/ToastContext';
import Dialog from '../../../../components/ui/Dialog';
import CreateQuestionModal from './CreateQuestionModal';
import CreateAnswerModal from '../Answer/CreateAnswerModal';
import editIcon from '../../../../assets/images/edit.png';
import deleteIcon from '../../../../assets/images/delete.png';
import './ExamQuestionsManager.css';

export default function ExamQuestionsManager({ exam, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [showCreateAnswerModal, setShowCreateAnswerModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('question');
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchQuestions();
  }, [exam.id]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await examService.getQuestionsByExam(exam.id);
      const questionsData = response.data || response || [];
      
      const questionsWithAnswers = await Promise.all(
        questionsData.map(async (q) => {
          try {
            const answersRes = await examService.getAnswersByQuestion(q.id);
            return {
              ...q,
              answers: answersRes.data || answersRes || []
            };
          } catch (error) {
            return { ...q, answers: [] };
          }
        })
      );
      
      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error(t('admin.exams.loadQuestionsError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleDeleteQuestion = (questionId) => {
    console.log('🟡 handleDeleteQuestion called with ID:', questionId);
    setItemToDelete(questionId);
    setDeleteType('question');
    setShowDeleteDialog(true);
  };

  const handleDeleteAnswer = (answerId) => {
    console.log('🟡 handleDeleteAnswer called with ID:', answerId);
    // ✅ البحث عن questionId الذي تنتمي إليه الإجابة
    let foundQuestionId = null;
    for (const q of questions) {
      if (q.answers && q.answers.some(a => a.id === answerId)) {
        foundQuestionId = q.id;
        break;
      }
    }
    setItemToDelete({ id: answerId, questionId: foundQuestionId });
    setDeleteType('answer');
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    console.log('🟢 confirmDelete called - Type:', deleteType, 'Item:', itemToDelete);
    try {
      if (deleteType === 'question') {
        console.log('📤 Deleting question:', itemToDelete, 'from exam:', exam.id);
        await examService.deleteQuestion(exam.id, itemToDelete);
        toast.success(t('admin.exams.questionDeleteSuccess'));
      } else {
        // ✅ حذف إجابة مع questionId
        const { id: answerId, questionId } = itemToDelete;
        console.log('📤 Deleting answer:', answerId, 'from question:', questionId);
        await examService.deleteAnswer(questionId, answerId);
        toast.success(t('admin.exams.answerDeleteSuccess'));
      }
      await fetchQuestions();
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast.error(error.message || t('admin.exams.deleteError'));
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const handleSetCorrectAnswer = async (questionId, answerId) => {
    console.log('🟡 Setting correct answer - Question:', questionId, 'Answer:', answerId);
    try {
      if (!questionId || !answerId) {
        toast.error('Invalid question or answer ID');
        return;
      }
      await examService.setCorrectAnswer(questionId, answerId);
      toast.success(t('admin.exams.correctAnswerSet'));
      await fetchQuestions();
    } catch (error) {
      console.error('❌ Error setting correct answer:', error);
      toast.error(error.message || t('admin.exams.correctAnswerError'));
    }
  };

  const getQuestionTypeLabel = (type) => {
    const types = {
      'SingleAnswer': t('admin.exams.singleAnswer'),
      'MultipleAnswer': t('admin.exams.multipleAnswer'),
      'Text': t('admin.exams.textAnswer')
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="questions-manager-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📝 {exam.title} - {t('admin.exams.questions')}</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body loading">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="questions-manager-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2>📝 {exam.title} - {t('admin.exams.questions')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <button 
            className="add-question-btn"
            onClick={() => setShowCreateQuestionModal(true)}
          >
            + {t('admin.exams.addQuestion')}
          </button>

          {questions.length === 0 ? (
            <div className="empty-state">
              <p>{t('admin.exams.noQuestions')}</p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((q, index) => (
                <div key={q.id} className="question-item">
                  <div 
                    className="question-header"
                    onClick={() => toggleExpand(q.id)}
                  >
                    <div className="question-info">
                      <span className="question-number">#{index + 1}</span>
                      <span className="question-text">{q.text}</span>
                      <span className="question-type">{getQuestionTypeLabel(q.type)}</span>
                      <span className="question-points">{q.points} pts</span>
                    </div>
                    <div className="question-actions">
                      <button 
                        className="add-answer-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQuestion(q);
                          setShowCreateAnswerModal(true);
                        }}
                        title={t('admin.exams.addAnswer')}
                      >
                        ➕
                      </button>
                      <button 
                        className="edit-btn-small"
                        onClick={(e) => e.stopPropagation()}
                        title={t('common.edit')}
                      >
                        <img src={editIcon} alt="edit" className="action-icon-small" />
                      </button>
                      <button 
                        className="delete-btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(q.id);
                        }}
                        title={t('common.delete')}
                      >
                        <img src={deleteIcon} alt="delete" className="action-icon-small" />
                      </button>
                      <span className={`expand-icon ${expandedQuestions[q.id] ? 'expanded' : ''}`}>
                        ▶
                      </span>
                    </div>
                  </div>

                  {expandedQuestions[q.id] && (
                    <div className="answers-section">
                      <div className="answers-header">
                        <span>{t('admin.exams.answers')}</span>
                      </div>
                      {q.answers && q.answers.length > 0 ? (
                        <div className="answers-list">
                          {q.answers.map(a => (
                            <div key={a.id} className="answer-item">
                              <span className={`answer-bullet ${a.isCorrect ? 'correct' : ''}`}>
                                {a.isCorrect ? '✓' : '○'}
                              </span>
                              <span className="answer-text">{a.text}</span>
                              <div className="answer-actions">
                                {!a.isCorrect && (
                                  <button 
                                    className="set-correct-btn"
                                    onClick={() => handleSetCorrectAnswer(q.id, a.id)}
                                  >
                                    {t('admin.exams.setCorrect')}
                                  </button>
                                )}
                                <button 
                                  className="delete-btn-small"
                                  onClick={() => handleDeleteAnswer(a.id)}
                                  title={t('common.delete')}
                                >
                                  <img src={deleteIcon} alt="delete" className="action-icon-small" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-answers">
                          <p>{t('admin.exams.noAnswers')}</p>
                          <button 
                            className="add-answer-small"
                            onClick={() => {
                              setSelectedQuestion(q);
                              setShowCreateAnswerModal(true);
                            }}
                          >
                            + {t('admin.exams.addAnswer')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateQuestionModal && (
        <CreateQuestionModal
          examId={exam.id}
          onClose={() => setShowCreateQuestionModal(false)}
          onSuccess={() => {
            fetchQuestions();
            setShowCreateQuestionModal(false);
            toast.success(t('admin.exams.questionCreateSuccess'));
          }}
        />
      )}

      {showCreateAnswerModal && selectedQuestion && (
        <CreateAnswerModal
          question={selectedQuestion}
          onClose={() => {
            setShowCreateAnswerModal(false);
            setSelectedQuestion(null);
          }}
          onSuccess={() => {
            fetchQuestions();
            setShowCreateAnswerModal(false);
            setSelectedQuestion(null);
            toast.success(t('admin.exams.answerCreateSuccess'));
          }}
        />
      )}

      {showDeleteDialog && (
        <Dialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete}
          title={t('dialog.deleteTitle')}
          message={deleteType === 'question' 
            ? t('admin.exams.confirmDeleteQuestion') 
            : t('admin.exams.confirmDeleteAnswer')}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          type="danger"
        />
      )}
    </div>
  );
}
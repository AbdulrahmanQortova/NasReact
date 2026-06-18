// src/pages/Admin/components/Exam/ExamsManagement.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { examService } from '../../../../services/examService';
import { courseService } from '../../../../services/courseService';
import { useToast } from '../../../../context/ToastContext';
import Dialog from '../../../../components/ui/Dialog';
import CreateExamModal from './CreateExamModal';
import EditExamModal from './EditExamModal';
import ExamQuestionsManager from '../Question/ExamQuestionsManager';
import editIcon from '../../../../assets/images/edit.png';
import deleteIcon from '../../../../assets/images/delete.png';
import questionIcon from '../../../../assets/images/question.png';
import './ExamsManagement.css';

export default function ExamsManagement() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('free'); // 'free' | 'course'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, coursesRes] = await Promise.all([
        examService.getAllExams(),
        courseService.getAll({ pageSize: 1000 })
      ]);
      
      // Ensure we have the data properly
      const examsData = examsRes.data || examsRes || [];
      const coursesData = coursesRes.items || coursesRes.data || [];
      
      setExams(examsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('admin.exams.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = (examId) => {
    setExamToDelete(examId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteExam = async () => {
    try {
      await examService.deleteExam(examToDelete);
      await fetchData();
      toast.success(t('admin.exams.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error(t('admin.exams.deleteFailed'));
    } finally {
      setShowDeleteDialog(false);
      setExamToDelete(null);
    }
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setShowEditModal(true);
  };

  const handleManageQuestions = (exam) => {
    setSelectedExam(exam);
    setShowQuestionsModal(true);
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || t('admin.exams.standalone');
  };

  // Filter exams based on active tab
  const filteredExams = exams.filter(exam => {
    if (activeTab === 'free') {
      return !exam.courseId || exam.courseId === null;
    } else {
      return exam.courseId && exam.courseId !== null;
    }
  });

  // Get question count properly
  const getQuestionCount = (exam) => {
    // If exam has questions array, use its length
    if (exam.questions && Array.isArray(exam.questions)) {
      return exam.questions.length;
    }
    // If exam has questionCount property, use it
    if (exam.questionCount !== undefined && exam.questionCount !== null) {
      return exam.questionCount;
    }
    // If exam has questions but it's not an array (could be string or number)
    if (exam.questions) {
      // If it's a number, use it
      if (typeof exam.questions === 'number') {
        return exam.questions;
      }
      // If it's an object or string, try to count
      if (typeof exam.questions === 'object') {
        return Object.keys(exam.questions).length;
      }
    }
    return 0;
  };

  if (loading) {
    return <div className="management-loading">{t('admin.exams.loading')}</div>;
  }

  return (
    <div className="exams-management-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="management-header">
        <div className="header-info">
          <h2>{t('admin.exams.title')}</h2>
          <span className="exam-count">{t('admin.exams.total', { count: exams.length })}</span>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          + {t('admin.exams.createNew')}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'free' ? 'active' : ''}`}
          onClick={() => setActiveTab('free')}
        >
          {t('admin.exams.freeExams')}
          <span className="tab-count">
            {exams.filter(e => !e.courseId || e.courseId === null).length}
          </span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'course' ? 'active' : ''}`}
          onClick={() => setActiveTab('course')}
        >
          {t('admin.exams.courseExams')}
          <span className="tab-count">
            {exams.filter(e => e.courseId && e.courseId !== null).length}
          </span>
        </button>
      </div>

      {filteredExams.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin.exams.noExams')}</p>
          <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
            {t('admin.exams.createFirst')}
          </button>
        </div>
      ) : (
        <div className="exams-table-container">
          <table className="exams-table">
            <thead>
              <tr>
                <th>{t('admin.exams.title')}</th>
                <th>{t('admin.exams.course')}</th>
                <th>{t('admin.exams.duration')}</th>
                <th>{t('admin.exams.passingScore')}</th>
                <th>{t('admin.exams.questions')}</th>
                <th>{t('admin.exams.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.map(exam => {
                const questionCount = getQuestionCount(exam);
                return (
                  <tr key={exam.id}>
                    <td className="exam-title-cell">
                      <span>{exam.title}</span>
                      {exam.isPublished && (
                        <span className="published-badge">✓</span>
                      )}
                    </td>
                    <td>{getCourseTitle(exam.courseId)}</td>
                    <td>{exam.durationInMinutes} min</td>
                    <td>{exam.passingScore}%</td>
                    <td>
                      <button 
                        className="questions-count-btn"
                        onClick={() => handleManageQuestions(exam)}
                      >
                        {questionCount}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditExam(exam)}
                          title={t('common.edit')}
                        >
                          <img src={editIcon} alt="edit" className="action-icon-small" />
                        </button>
                        <button 
                          className="questions-btn"
                          onClick={() => handleManageQuestions(exam)}
                          title={t('admin.exams.manageQuestions')}
                        >
                          <img src={questionIcon} alt="questions" className="action-icon-small" />
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteExam(exam.id)}
                          title={t('common.delete')}
                        >
                          <img src={deleteIcon} alt="delete" className="action-icon-small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateExamModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchData();
            setShowCreateModal(false);
            toast.success(t('admin.exams.createSuccess'));
          }}
        />
      )}

      {showEditModal && selectedExam && (
        <EditExamModal
          exam={selectedExam}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExam(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowEditModal(false);
            setSelectedExam(null);
            toast.success(t('admin.exams.updateSuccess'));
          }}
        />
      )}

      {showQuestionsModal && selectedExam && (
        <ExamQuestionsManager
          exam={selectedExam}
          onClose={() => {
            setShowQuestionsModal(false);
            setSelectedExam(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowQuestionsModal(false);
            setSelectedExam(null);
          }}
        />
      )}

      {showDeleteDialog && (
        <Dialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setExamToDelete(null);
          }}
          onConfirm={confirmDeleteExam}
          title={t('dialog.deleteTitle')}
          message={t('admin.exams.confirmDelete')}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          type="danger"
        />
      )}
    </div>
  );
}
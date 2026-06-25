// src/pages/Courses/CourseDetailsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../services/courseService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import Dialog from '../../components/ui/Dialog';
import RatingModal from './components/RatingModal';
import CourseSidebar from './components/CourseSidebar';
import LessonContent from './components/LessonContent';
import './CourseDetailsPage.css';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const isLoggedIn = authService.isAuthenticated();
  const isStudent = authService.isStudent();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchCourseDetails();
    fetchSections();
    if (isLoggedIn) {
      checkEnrollment();
      checkUserRating();
    }
  }, [id, isLoggedIn]);

  const fetchCourseDetails = async () => {
    try {
      const response = await courseService.getById(id);
      setCourse(response.data || response);
    } catch (error) {
      console.error('Error fetching course:', error);
      setError(t('courseDetails.loadError'));
      toast.error(t('courseDetails.loadError'));
    }
  };

  const fetchSections = async () => {
    try {
      const response = await courseService.getCourseSections(id);
      const sectionsData = response.data || response || [];
      
      const sectionsWithLessons = await Promise.all(
        sectionsData.map(async (section) => {
          try {
            const lessonsResponse = await courseService.getLessons(section.id);
            return {
              ...section,
              lessons: lessonsResponse.data || lessonsResponse || []
            };
          } catch (error) {
            console.error(`Error fetching lessons for section ${section.id}:`, error);
            return {
              ...section,
              lessons: []
            };
          }
        })
      );
      
      setSections(sectionsWithLessons);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const enrollments = await courseService.getMyEnrollments();
      setIsEnrolled(enrollments.some(e => e.courseId === id));
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const checkUserRating = async () => {
    try {
      const ratings = await courseService.getRatings(id);
      const user = authService.getCurrentUser();
      if (user && ratings && ratings.items) {
        const userRating = ratings.items.find(r => r.studentId === user.id);
        if (userRating) {
          setUserRating(userRating);
        }
      }
    } catch (error) {
      console.error('Error checking user rating:', error);
    }
  };

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (course.price > 0) {
      navigate(`/payment/${id}`, { state: { course } });
      return;
    }

    setIsEnrolling(true);
    try {
      await courseService.enrollInCourse(id);
      setIsEnrolled(true);
      toast.success(t('courseDetails.enrollSuccess'));
      await fetchCourseDetails();
      await checkEnrollment();
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error.message || t('courseDetails.enrollFailed'));
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenroll = () => {
    setShowUnenrollDialog(true);
  };

  const confirmUnenroll = async () => {
    try {
      await courseService.unenrollFromCourse(id);
      setIsEnrolled(false);
      toast.success(t('courses.unenrollSuccess'));
      await fetchCourseDetails();
      await checkEnrollment();
    } catch (error) {
      console.error('Unenroll error:', error);
      toast.error(error.message || t('courses.unenrollFailed'));
    } finally {
      setShowUnenrollDialog(false);
    }
  };

  const handleRateClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      await courseService.rateCourse(id, {
        value: ratingData.rating,
        review: ratingData.comment || ''
      });
      toast.success(t('courses.rateSuccess'));
      setShowRatingModal(false);
      await fetchCourseDetails();
      await checkUserRating();
    } catch (error) {
      console.error('Rating error:', error);
      toast.error(error.message || t('courses.rateFailed'));
    }
  };

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
    setSelectedLessonId(lesson.id);
  };

  const getImageUrl = (thumbnailUrl) => {
    if (!thumbnailUrl) return null;
    if (thumbnailUrl.startsWith('/')) {
      return `https://localhost:7021${thumbnailUrl}`;
    }
    return thumbnailUrl;
  };

  const getLevelName = (level) => {
    const levelMap = {
      0: t('courses.level.beginner'),
      1: t('courses.level.intermediate'),
      2: t('courses.level.advanced')
    };
    return levelMap[level] || t('courses.level.beginner');
  };

  const getLevelClass = (level) => {
    const levelMap = { 0: 'beginner', 1: 'intermediate', 2: 'advanced' };
    return levelMap[level] || 'beginner';
  };

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return t('courses.free');
    if (numPrice <= 0) return t('courses.free');
    return `$${numPrice.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="course-details-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-details-error">
        <p>{t('courseDetails.notFound')}</p>
        <button onClick={() => navigate('/courses')} className="back-btn">
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="course-details-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/courses')}>
        ← {t('common.back')}
      </button>

      {/* Course Hero */}
      <div className="course-hero">
        <div className="course-hero-image">
          {course.thumbnailUrl ? (
            <img src={getImageUrl(course.thumbnailUrl)} alt={course.title} />
          ) : (
            <div className="course-hero-placeholder">📚</div>
          )}
        </div>
        <div className="course-hero-content">
          <h1>{course.title}</h1>
          <p className="course-description">{course.description}</p>
          
          <div className="course-meta">
            <span className={`level-badge level-${getLevelClass(course.level)}`}>
              {getLevelName(course.level)}
            </span>
            <span className="duration-badge">⏱️ {course.durationInMinutes} {t('courses.duration')}</span>
            <span className="rating-badge">⭐ {course.averageRating || 0} ({course.totalRatings || 0})</span>
          </div>

          {/* Rating Section */}
          {isLoggedIn && isEnrolled && (
            <div className="user-rating-section">
              {userRating ? (
                <div className="user-rating-display">
                  <span>{t('courseDetails.yourRating')}: </span>
                  <span className="user-rating-stars">
                    {'★'.repeat(userRating.value)}{'☆'.repeat(5 - userRating.value)}
                  </span>
                  <button className="update-rating-btn" onClick={handleRateClick}>
                    {t('courseDetails.updateRating')}
                  </button>
                </div>
              ) : (
                <button className="rate-btn-small" onClick={handleRateClick}>
                  ⭐ {t('courses.rate')}
                </button>
              )}
            </div>
          )}

          {/* Enrollment Actions */}
          <div className="course-price-section">
            <span className="price-large">{formatPrice(course.price)}</span>
            
            {!isEnrolled ? (
              <button 
                className={`enroll-btn-large ${course.price > 0 ? 'paid' : 'free'}`}
                onClick={handleEnroll}
                disabled={isEnrolling}
              >
                {isEnrolling ? t('common.loading') : (
                  course.price > 0 ? t('courseDetails.buyNow') : t('courseDetails.enrollFree')
                )}
              </button>
            ) : (
              <div className="enrolled-actions">
                <button className="enrolled-btn-large" disabled>
                  ✓ {t('courses.enrolled')}
                </button>
                <button className="unenroll-btn-small" onClick={handleUnenroll}>
                  {t('courses.unenroll')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Content - Sidebar + Lesson */}
      <div className="course-content-layout">
        <div className="course-sidebar-wrapper">
          <CourseSidebar 
            sections={sections}
            onLessonSelect={handleLessonSelect}
            selectedLessonId={selectedLessonId}
          />
        </div>
        <div className="course-lesson-wrapper">
          <LessonContent lesson={selectedLesson} />
        </div>
      </div>

      {/* Unenroll Dialog */}
      {showUnenrollDialog && (
        <Dialog
          isOpen={showUnenrollDialog}
          onClose={() => setShowUnenrollDialog(false)}
          onConfirm={confirmUnenroll}
          title={t('dialog.unenrollTitle')}
          message={t('dialog.unenrollMessage')}
          confirmText={t('courses.unenroll')}
          cancelText={t('common.cancel')}
          type="danger"
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          course={course}
          onClose={() => {
            setShowRatingModal(false);
          }}
          onSubmit={handleRatingSubmit}
          initialRating={userRating?.value || 5}
          initialReview={userRating?.review || ''}
        />
      )}
    </div>
  );
}
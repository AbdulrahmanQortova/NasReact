// src/pages/Payment/PaymentPage.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { courseService } from '../../services/courseService';
import './PaymentPage.css';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const course = location.state?.course;
  const isRTL = i18n.language === 'ar';

  if (!course) {
    return (
      <div className="payment-error">
        <p>{t('payment.noCourse')}</p>
        <button onClick={() => navigate('/courses')} className="back-btn">
          {t('common.back')}
        </button>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    try {

      await courseService.enrollInCourse(course.id);
      toast.success(t('payment.success'));
      navigate(`/courses/${course.id}`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || t('payment.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="payment-card">
        <h1>{t('payment.title')}</h1>
        <div className="payment-course-info">
          <h3>{course.title}</h3>
          <p className="payment-price">
            {course.price > 0 ? `$${course.price.toFixed(2)}` : t('courses.free')}
          </p>
        </div>
        
        <div className="payment-details">
          <div className="payment-row">
            <span>{t('payment.course')}</span>
            <span>{course.title}</span>
          </div>
          <div className="payment-row">
            <span>{t('payment.amount')}</span>
            <span className="payment-amount">
              {course.price > 0 ? `$${course.price.toFixed(2)}` : t('courses.free')}
            </span>
          </div>
        </div>

        <div className="payment-actions">
          <button 
            className="cancel-btn" 
            onClick={() => navigate(-1)}
          >
            {t('common.cancel')}
          </button>
          <button 
            className="pay-btn"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? t('common.loading') : t('payment.payNow')}
          </button>
        </div>

        <p className="payment-note">
          {t('payment.note')}
        </p>
      </div>
    </div>
  );
}
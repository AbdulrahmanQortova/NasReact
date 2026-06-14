import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../services/courseService';
import { authService } from '../../services/authService';
import './Home.css';

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === 'ar';
  const isLoggedIn = authService.isAuthenticated();

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getAll({ pageSize: 6 });
      const coursesData = response.items || response.data || [];
      setFeaturedCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
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

  const getLevelColor = (level) => {
    const levelName = getLevelName(level);
    switch (levelName) {
      case t('courses.level.beginner'): return 'level-beginner';
      case t('courses.level.intermediate'): return 'level-intermediate';
      case t('courses.level.advanced'): return 'level-advanced';
      default: return 'level-beginner';
    }
  };

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return t('courses.free');
    if (numPrice <= 0) return t('courses.free');
    return `$${numPrice.toFixed(2)}`;
  };

  const renderStars = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="star half">½</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  return (
    <div className="home-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🎓</span>
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="hero-title">
            {t('hero.title')}
            <span className="gradient-text"> {t('hero.titleGradient')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('hero.subtitle')}
          </p>
          <div className="hero-buttons">
            <button className="hero-btn primary" onClick={() => navigate('/courses')}>
              {t('home.exploreCourses')}
            </button>
 
            {!isLoggedIn && (
              <button className="hero-btn secondary" onClick={() => navigate('/register')}>
                {t('home.getStarted')}
              </button>
            )}
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">{t('hero.courses')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">{t('hero.students')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">{t('hero.instructors')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2>{t('home.featuredCourses')}</h2>
          <p>{t('home.featuredSubtitle')}</p>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            <div className="featured-grid">
              {featuredCourses.map(course => (
                <div key={course.id} className="course-card">
                  <div className="course-card-image">
                    {course.thumbnailUrl ? (
                      <img 
                        src={getImageUrl(course.thumbnailUrl)} 
                        alt={course.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="course-card-image-placeholder">📚</div>';
                        }}
                      />
                    ) : (
                      <div className="course-card-image-placeholder">📚</div>
                    )}
                    <span className={`course-level ${getLevelColor(course.level)}`}>
                      {getLevelName(course.level)}
                    </span>
                  </div>
                  <div className="course-card-content">
                    <h3 className="course-card-title">{course.title}</h3>
                    <p className="course-card-description">
                      {course.description?.substring(0, 100)}
                      {course.description?.length > 100 ? '...' : ''}
                    </p>
                    
                    <div className="course-card-meta">
                      <div className="course-rating">
                        {renderStars(course.averageRating)}
                        <span className="rating-value">({course.totalRatings || 0})</span>
                      </div>
                      <div className="course-duration">
                        ⏱️ {course.durationInMinutes} {t('courses.duration')}
                      </div>
                    </div>

                    <div className="course-price">
                      <span className={course.price > 0 ? "price-value" : "price-free"}>
                        {formatPrice(course.price)}
                      </span>
                    </div>
                  </div>
                  <div className="course-card-actions">
                    <button className="view-btn" onClick={() => navigate(`/courses/${course.id}`)}>
                      {t('courses.viewCourse')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="view-all-btn">
              <button className="view-all-courses" onClick={() => navigate('/courses')}>
                {t('home.viewAllCourses')} →
              </button>
            </div>
          </>
        )}
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>{t('home.whyChooseUs')}</h2>
          <p>{t('home.whyChooseUsSubtitle')}</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>{t('home.expertInstructors')}</h3>
            <p>{t('home.expertInstructorsDesc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>{t('home.comprehensiveCourses')}</h3>
            <p>{t('home.comprehensiveCoursesDesc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>{t('home.certificates')}</h3>
            <p>{t('home.certificatesDesc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>{t('home.community')}</h3>
            <p>{t('home.communityDesc')}</p>
          </div>
        </div>
      </section>


      {!isLoggedIn && (
        <section className="cta-section">
          <div className="cta-content">
            <h2>{t('home.readyToStart')}</h2>
            <p>{t('home.readyToStartSubtitle')}</p>
            <button className="cta-btn" onClick={() => navigate('/register')}>
              {t('home.getStartedNow')} →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
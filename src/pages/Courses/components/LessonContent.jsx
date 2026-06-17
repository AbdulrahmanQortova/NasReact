// src/pages/Courses/components/LessonContent.jsx
import { useTranslation } from 'react-i18next';
import './LessonContent.css';

export default function LessonContent({ lesson }) {
  const { t } = useTranslation();

  // ✅ دالة لاستخراج YouTube Video ID من الرابط
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // دعم جميع صيغ YouTube
    const patterns = [
      // https://www.youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      // https://youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([^&\n?#]+)/,
      // https://youtube.com/v/VIDEO_ID
      /youtube\.com\/v\/([^&\n?#]+)/,
      // https://youtube.com/shorts/VIDEO_ID
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    // إذا كان الرابط يحتوي على embed بالفعل
    if (url.includes('youtube.com/embed/')) {
      return url.split('/embed/')[1]?.split('?')[0];
    }
    
    return null;
  };

  // ✅ دالة لإنشاء iframe
  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
  };

  if (!lesson) {
    return (
      <div className="lesson-content-empty">
        <div className="empty-state-icon">📖</div>
        <h3>{t('courseDetails.selectLesson')}</h3>
        <p>{t('courseDetails.selectLessonHint')}</p>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
  const isYouTubeVideo = embedUrl !== null;

  return (
    <div className="lesson-content">
      <div className="lesson-content-header">
        <div className="lesson-badge">
          {lesson.isFreePreview ? '🔓' : '🔒'}
          <span>{lesson.isFreePreview ? t('courseDetails.freePreview') : t('courseDetails.premium')}</span>
        </div>
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="lesson-meta">
          <span>⏱️ {lesson.durationInMinutes} {t('courses.duration')}</span>
        </div>
      </div>

      <div className="lesson-content-body">
        {/* ✅ فيديو يوتيوب عبر iframe */}
        {isYouTubeVideo ? (
          <div className="video-container">
            <iframe
              src={embedUrl}
              className="lesson-video-iframe"
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : lesson.videoUrl ? (
          <div className="video-container">
            <video 
              controls 
              src={lesson.videoUrl}
              className="lesson-video"
            >
              {t('courseDetails.videoNotSupported')}
            </video>
          </div>
        ) : (
          <div className="content-placeholder">
            <div className="placeholder-icon">📹</div>
            <p>{t('courseDetails.noVideo')}</p>
          </div>
        )}

        {/* ✅ عرض الوصف إذا كان موجوداً */}
        {lesson.contentMarkdown && (
          <div className="lesson-description">
            <h3>{t('courseDetails.description')}</h3>
            <div className="markdown-content">
              {lesson.contentMarkdown.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
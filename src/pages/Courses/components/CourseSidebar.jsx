// src/pages/Courses/components/CourseSidebar.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './CourseSidebar.css';

export default function CourseSidebar({ sections, onLessonSelect, selectedLessonId, completedLessonIds = [] }) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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

  return (
    <div className="course-sidebar">
      <div className="sidebar-header">
        <h3>{t('courseDetails.sections')}</h3>
        <span className="section-count">{sections.length}</span>
      </div>

      <div className="sidebar-sections">
        {sections.map((section, index) => {
          const isExpanded = expandedSections[section.id] || false;
          const lessonCount = section.lessons?.length || 0;

          return (
            <div key={section.id} className="sidebar-section">
              <div 
                className="section-header-clickable"
                onClick={() => toggleSection(section.id)}
              >
                <div className="section-info">
                  <span className="section-number">{section.order || index + 1}</span>
                  <span className="section-title">{section.title}</span>
                </div>
                <div className="section-meta">
                  <span className="lesson-count">{lessonCount}</span>
                  <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                    ▶
                  </span>
                </div>
              </div>

              {isExpanded && lessonCount > 0 && (
                <div className="sidebar-lessons">
                  {section.lessons.map(lesson => {
                    const isCompleted = completedLessonIds.includes(lesson.id);
                    return (
                    <div
                      key={lesson.id}
                      className={`sidebar-lesson ${selectedLessonId === lesson.id ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      onClick={() => onLessonSelect(lesson)}
                    >
                      <span className="lesson-status">
                        {isCompleted ? '✅' : lesson.isFreePreview ? '🔓' : '🔒'}
                      </span>
                      <span className="lesson-title">{lesson.title}</span>
                      <span className="lesson-duration">{lesson.durationInMinutes}m</span>
                    </div>
                  );})}
                </div>
              )}

              {isExpanded && lessonCount === 0 && (
                <div className="no-lessons">
                  <span>{t('courseDetails.noLessons')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
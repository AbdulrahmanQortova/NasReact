// src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import Sidebar from './components/Sidebar';
import CoursesManagement from './components/CoursesManagement';
import TopicsManagement from './components/TopicsManagement';
import LearningPathsManagement from './components/LearningPathsManagement';
import ExamsManagement from './components/Exam/ExamsManagement';
import UsersManagement from './components/UsersManagement';
import ReportsManagement from './components/ReportsManagement';
import SettingsManagement from './components/SettingsManagement';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const isAdmin = authService.isAdmin();
    if (!isAdmin) {
      navigate('/courses');
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return <CoursesManagement />;
      case 'topics':
        return <TopicsManagement />;
      case 'learningPaths':
        return <LearningPathsManagement />;
      case 'exams':
        return <ExamsManagement />;
      case 'users':
        return <UsersManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'settings':
        return <SettingsManagement />;
      default:
        return <CoursesManagement />;
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>{t('admin.loading')}</p>
      </div>
    );
  }

  return (
    <div className="admin-layout" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="admin-main">
        <div className="admin-main-header">
          <h1>{t(`admin.titles.${activeTab}`)}</h1>
          <p>{t(`admin.descriptions.${activeTab}`)}</p>
        </div>
        <div className="admin-main-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
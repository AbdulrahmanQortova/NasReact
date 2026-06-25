import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faCamera, faSave, faLock, 
  faSpinner, faCheck, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { faGithub as faGithubBrand, faLinkedin as faLinkedinBrand } from '@fortawesome/free-brands-svg-icons';import { api, getFormDataHeaders } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './ProfilePage.css';
import { authService } from '../../services/authService';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://localhost:7021/api').replace('/api', '');

const getAvatarUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const isRTL = i18n.language === 'ar';
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Profile form
  const [form, setForm] = useState({
    firstName: '', lastName: '', bio: '',
    githubProfileUrl: '', linkedInProfileUrl: '', department: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Password form
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmNewPassword: ''
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.get('/Auth/me');
      const u = data.data || data;
      setUser(u);
      setForm({
        firstName:         u.firstName         || '',
        lastName:          u.lastName          || '',
        bio:               u.bio               || '',
        githubProfileUrl:  u.githubProfileUrl  || '',
        linkedInProfileUrl:u.linkedInProfileUrl|| '',
        department:        u.department        || '',
      });
    } catch {
      toast.error(t('profile.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t('profile.imageSizeError')); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSaveProfile = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error(t('profile.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('FirstName', form.firstName.trim());
      fd.append('LastName',  form.lastName.trim());
      fd.append('Bio',               form.bio               || '');
      fd.append('GithubProfileUrl',  form.githubProfileUrl  || '');
      fd.append('LinkedInProfileUrl',form.linkedInProfileUrl|| '');
      fd.append('Department',        form.department        || '');
      if (avatarFile) fd.append('ProfileImage', avatarFile);

      const result = await api.put('/Auth/profile', fd, true);
      const updated = result.data || result;

      // update localStorage
  const userStr = localStorage.getItem('user_data');
const stored = userStr ? JSON.parse(userStr) : {};
      const newUser = {
        ...stored,
        firstName:         form.firstName.trim(),
        lastName:          form.lastName.trim(),
        profilePictureUrl: updated.profilePictureUrl || stored?.profilePictureUrl,
      };
      localStorage.setItem('user_data', JSON.stringify(newUser));
      window.dispatchEvent(new Event('auth:login'));

      setAvatarFile(null);
      setAvatarPreview(null);
      await loadProfile();
      toast.success(t('profile.saveSuccess'));
    } catch (err) {
      toast.error(err.message || t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmNewPassword) {
      toast.error(t('profile.fillAllFields'));
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error(t('profile.passwordTooShort'));
      return;
    }
    setSavingPw(true);
    try {
      await api.post('/Auth/change-password', {
        currentPassword:  pwForm.currentPassword,
        newPassword:      pwForm.newPassword,
        confirmNewPassword: pwForm.confirmNewPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast.success(t('profile.passwordChanged'));
    } catch (err) {
      toast.error(err.message || t('profile.passwordError'));
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  const avatarSrc = avatarPreview || getAvatarUrl(user?.profilePictureUrl);
  const initials  = `${form.firstName?.charAt(0) || ''}${form.lastName?.charAt(0) || ''}`.toUpperCase() || '?';

  return (
    <div className="profile-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="profile-container">

        {/* ── Left card ── */}
        <div className="profile-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-circle">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" onError={e => e.target.style.display='none'} />
                : <span>{initials}</span>}
            </div>
            <button className="profile-avatar-edit" onClick={() => fileInputRef.current?.click()}>
              <FontAwesomeIcon icon={faCamera} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          </div>

          <h2 className="profile-name">{form.firstName} {form.lastName}</h2>
          <p  className="profile-email">{user?.email}</p>
          {form.department && <p className="profile-dept">{form.department}</p>}

          <div className="profile-social">
            {form.githubProfileUrl && (
              <a href={form.githubProfileUrl} target="_blank" rel="noreferrer" className="social-link github">
                <FontAwesomeIcon icon={faGithubBrand} />
              </a>
            )}
            {form.linkedInProfileUrl && (
              <a href={form.linkedInProfileUrl} target="_blank" rel="noreferrer" className="social-link linkedin">
                <FontAwesomeIcon icon={faLinkedinBrand} />
              </a>
            )}
          </div>

          {avatarFile && (
            <p className="profile-avatar-hint">
              📎 {avatarFile.name}
            </p>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="profile-panel">
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <FontAwesomeIcon icon={faUser} />
              {t('profile.tabInfo')}
            </button>
            <button
              className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <FontAwesomeIcon icon={faLock} />
              {t('profile.tabPassword')}
            </button>
          </div>

          {/* Info tab */}
          {activeTab === 'info' && (
            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{t('profile.firstName')} *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                    maxLength={100}
                  />
                </div>
                <div className="form-group">
                  <label>{t('profile.lastName')} *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('profile.email')}</label>
                <input type="email" value={user?.email || ''} disabled className="input-disabled" />
                <span className="input-hint">{t('profile.emailHint')}</span>
              </div>

              <div className="form-group">
                <label>{t('profile.bio')}</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  maxLength={1000}
                  placeholder={t('profile.bioPlaceholder')}
                />
                <span className="input-hint char-count">{form.bio.length}/1000</span>
              </div>

              <div className="form-group">
                <label>{t('profile.department')}</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  maxLength={150}
                  placeholder={t('profile.departmentPlaceholder')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FontAwesomeIcon icon={faGithubBrand} /> GitHub
                  </label>
                  <input
                    type="url"
                    value={form.githubProfileUrl}
                    onChange={e => setForm(p => ({ ...p, githubProfileUrl: e.target.value }))}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FontAwesomeIcon icon={faLinkedinBrand} /> LinkedIn
                  </label>
                  <input
                    type="url"
                    value={form.linkedInProfileUrl}
                    onChange={e => setForm(p => ({ ...p, linkedInProfileUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
                  {saving
                    ? <><FontAwesomeIcon icon={faSpinner} spin /> {t('common.saving')}</>
                    : <><FontAwesomeIcon icon={faSave} /> {t('profile.saveChanges')}</>}
                </button>
              </div>
            </div>
          )}

          {/* Password tab */}
          {activeTab === 'password' && (
            <div className="profile-form">
              {[
                { key: 'current',  label: t('profile.currentPassword'), field: 'currentPassword' },
                { key: 'new',      label: t('profile.newPassword'),      field: 'newPassword' },
                { key: 'confirm',  label: t('profile.confirmPassword'),  field: 'confirmNewPassword' },
              ].map(({ key, label, field }) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <div className="pw-input-wrap">
                    <input
                      type={showPw[key] ? 'text' : 'password'}
                      value={pwForm[field]}
                      onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                     onKeyDown={e => {
  e.stopPropagation(); 
  if (e.key === 'Enter') handleChangePassword();
}}
                    />
                    <button
                      className="pw-toggle"
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    >
                      <FontAwesomeIcon icon={showPw[key] ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="form-actions">
                <button className="save-btn" onClick={handleChangePassword} disabled={savingPw}>
                  {savingPw
                    ? <><FontAwesomeIcon icon={faSpinner} spin /> {t('common.saving')}</>
                    : <><FontAwesomeIcon icon={faCheck} /> {t('profile.changePassword')}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
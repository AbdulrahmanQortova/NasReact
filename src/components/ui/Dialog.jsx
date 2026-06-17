// src/components/ui/Dialog.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Dialog.css';

export default function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  confirmButtonClass = '',
}) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`dialog-overlay ${isVisible ? 'active' : ''}`} onClick={handleClose}>
      <div className={`dialog-content ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon">
          {type === 'warning' && '⚠️'}
          {type === 'danger' && '🗑️'}
          {type === 'info' && 'ℹ️'}
          {type === 'success' && '✅'}
        </div>
        
        <h3 className="dialog-title">{title}</h3>
        
        <p className="dialog-message">{message}</p>
        
        <div className="dialog-actions">
          <button className="dialog-btn dialog-cancel" onClick={handleClose}>
            {cancelText || t('common.cancel')}
          </button>
          <button 
            className={`dialog-btn dialog-confirm ${confirmButtonClass}`} 
            onClick={handleConfirm}
          >
            {confirmText || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
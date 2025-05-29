import React, { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

/**
 * Компонент отдельного Toast уведомления
 */
const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);

  useEffect(() => {
    // Анимация появления
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Автоматическое скрытие
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, handleClose]);

  const getToastStyles = () => {
    const baseClasses = `
      relative max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto
      transform transition-all duration-300 ease-in-out
      ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `;

    const borderColors = {
      success: 'border-l-4 border-green-500',
      error: 'border-l-4 border-red-500',
      warning: 'border-l-4 border-yellow-500',
      info: 'border-l-4 border-blue-500',
    };

    return `${baseClasses} ${borderColors[type]}`;
  };

  const getIconByType = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getColorsByType = () => {
    switch (type) {
      case 'success':
        return {
          titleColor: 'text-green-800',
          bgColor: 'bg-green-50',
          buttonColor: 'text-green-400 hover:text-green-600',
        };
      case 'error':
        return {
          titleColor: 'text-red-800',
          bgColor: 'bg-red-50',
          buttonColor: 'text-red-400 hover:text-red-600',
        };
      case 'warning':
        return {
          titleColor: 'text-yellow-800',
          bgColor: 'bg-yellow-50',
          buttonColor: 'text-yellow-400 hover:text-yellow-600',
        };
      case 'info':
        return {
          titleColor: 'text-blue-800',
          bgColor: 'bg-blue-50',
          buttonColor: 'text-blue-400 hover:text-blue-600',
        };
      default:
        return {
          titleColor: 'text-gray-800',
          bgColor: 'bg-gray-50',
          buttonColor: 'text-gray-400 hover:text-gray-600',
        };
    }
  };

  const colors = getColorsByType();

  return (
    <div className={getToastStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-xl">{getIconByType()}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${colors.titleColor}`}>
              {title}
            </p>
            {message && (
              <p className="mt-1 text-sm text-gray-600">
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex ${colors.buttonColor} transition-colors`}
              onClick={handleClose}
            >
              <span className="sr-only">Закрыть</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast; 
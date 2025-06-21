import React from 'react';
import { clsx } from 'clsx';
import Icon from './Icon';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * Компонент для отображения уведомлений
 */
const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  onClose,
  className
}) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconMap = {
    info: 'info' as const,
    success: 'check' as const,
    warning: 'warning' as const,
    error: 'alert' as const,
  };

  const classes = clsx(
    'flex items-start gap-3 p-4 border rounded-lg',
    variantClasses[variant],
    className
  );

  return (
    <div className={classes}>
      <Icon 
        name={iconMap[variant]} 
        size="sm" 
        className="flex-shrink-0 mt-0.5"
      />
      
      <div className="flex-1 min-w-0">
        {children}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded"
        >
          <Icon name="close" size="xs" />
        </button>
      )}
    </div>
  );
};

export default Alert; 
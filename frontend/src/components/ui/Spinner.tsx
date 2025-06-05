import React from 'react';
import { clsx } from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Компонент спиннера для отображения загрузки
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const classes = clsx(
    'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
    sizeClasses[size],
    className
  );

  return <div className={classes} />;
};

export default Spinner; 
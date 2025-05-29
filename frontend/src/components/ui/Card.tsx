import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

/**
 * Базовый компонент карточки
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const classes = clsx(
    'bg-white shadow rounded-lg border border-gray-200',
    paddingClasses[padding],
    hover && 'hover:shadow-md transition-shadow duration-200',
    className
  );
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Card; 
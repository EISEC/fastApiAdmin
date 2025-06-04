import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  gradient?: boolean;
}

/**
 * Базовый компонент карточки
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  gradient = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const classes = clsx(
    // Базовые стили согласно STYLE_GUIDE.md
    'bg-white rounded-2xl shadow-sm border border-gray-100',
    // Градиентный фон если включен
    gradient && 'relative overflow-hidden bg-gradient-to-br from-transparent to-gray-25',
    // Отступы
    paddingClasses[padding],
    // Hover эффекты согласно STYLE_GUIDE.md
    hover && 'hover:shadow-md transition-all duration-200 cursor-pointer',
    className
  );
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Card; 
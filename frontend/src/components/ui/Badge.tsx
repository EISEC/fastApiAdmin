import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Компонент бейджа для отображения статусов и меток
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'gray',
  size = 'sm',
  className
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const classes = clsx(
    baseClasses,
    colorClasses[color],
    sizeClasses[size],
    className
  );

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default Badge; 
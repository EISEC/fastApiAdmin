import React from 'react';
import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  className?: string;
}

/**
 * Компонент карточки статистики с анимациями и цветовыми схемами
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'blue',
  className = '',
}) => {
  const colorSchemes = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      text: 'text-green-600',
      lightBg: 'bg-green-50',
      border: 'border-green-200',
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      text: 'text-yellow-600',
      lightBg: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
    red: {
      bg: 'bg-gradient-to-br from-red-500 to-red-600',
      text: 'text-red-600',
      lightBg: 'bg-red-50',
      border: 'border-red-200',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50',
      border: 'border-purple-200',
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      text: 'text-indigo-600',
      lightBg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
  };

  const scheme = colorSchemes[color];

  const getChangeIcon = () => {
    if (!change) return null;
    
    if (change.type === 'increase') {
      return (
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (change.type === 'decrease') {
      return (
        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-25 rounded-2xl opacity-50"></div>
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
              {value}
            </p>
            
            {change && (
              <div className="flex items-center mt-2">
                {getChangeIcon()}
                <span className={`ml-1 text-sm font-medium ${
                  change.type === 'increase' ? 'text-green-600' :
                  change.type === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change.value}
                </span>
                <span className="ml-1 text-sm text-gray-500">за месяц</span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className={`flex-shrink-0 w-12 h-12 ${scheme.lightBg} rounded-xl flex items-center justify-center border ${scheme.border} group-hover:scale-110 transition-transform duration-200`}>
              <div className={`${scheme.text}`}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hover Effect */}
      <div className={`absolute inset-0 ${scheme.bg} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-200`}></div>
    </div>
  );
};

export default StatsCard; 
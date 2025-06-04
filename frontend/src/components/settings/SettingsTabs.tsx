import React from 'react';
import type { SettingsCategory, SettingCategory } from '../../types/settings.types';

interface SettingsTabsProps {
  categories: SettingsCategory[];
  currentCategory: SettingCategory;
  onChange: (category: SettingCategory) => void;
  hasUnsavedChanges?: boolean;
}

/**
 * Компонент навигации по категориям настроек
 */
const SettingsTabs: React.FC<SettingsTabsProps> = ({
  categories,
  currentCategory,
  onChange,
  hasUnsavedChanges = false
}) => {
  return (
    <div>
      <nav className="flex space-x-8 px-6" aria-label="Категории настроек">
        {categories
          .sort((a, b) => a.order - b.order)
          .map((category) => {
            const isActive = category.id === currentCategory;
            const hasGroupChanges = hasUnsavedChanges && isActive;
            
            return (
              <button
                key={category.id}
                onClick={() => onChange(category.id)}
                className={`
                  relative py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                  
                  {hasGroupChanges && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" 
                         title="Есть несохраненные изменения" />
                  )}
                </div>
                
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 rounded-t" />
                )}
              </button>
            );
          })}
      </nav>
      
      {hasUnsavedChanges && (
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">
              У вас есть несохраненные изменения
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTabs; 
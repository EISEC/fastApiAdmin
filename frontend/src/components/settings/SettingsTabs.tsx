import React from 'react';
import type { SettingsCategory, SettingCategory } from '../../types/settings.types';
import Icon from '../ui/Icon';

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
                  <Icon name={category.icon as any} size="sm" />
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
            <Icon name="warning" size="sm" color="warning" />
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
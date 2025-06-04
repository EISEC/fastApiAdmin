import React from 'react';
import { clsx } from 'clsx';
import Icon from '../ui/Icon';

interface TinyMCEEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
}

/**
 * Простая реализация текстового редактора
 * В будущем можно заменить на полноценный TinyMCE
 */
const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Введите текст...',
  disabled = false,
  height = 300,
  className
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        {/* Панель инструментов (заглушка) */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 px-3 py-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <button
              type="button"
              className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Жирный"
              disabled={disabled}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Курсив"
              disabled={disabled}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Подчеркнутый"
              disabled={disabled}
            >
              <u>U</u>
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs">
              Rich Text Editor (упрощенная версия)
            </span>
          </div>
        </div>
        
        {/* Область редактирования */}
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none resize-none',
            'dark:bg-gray-800 dark:text-white',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
          )}
          style={{ height: `${height}px` }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>
          Символов: {value.length}
        </span>
        <span className="flex items-center">
          <Icon name="warning" size="xs" className="mr-1" />
          Для полной функциональности установите TinyMCE
        </span>
      </div>
    </div>
  );
};

export default TinyMCEEditor; 
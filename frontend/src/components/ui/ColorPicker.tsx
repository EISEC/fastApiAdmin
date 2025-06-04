import React from 'react';
import { clsx } from 'clsx';

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}

/**
 * Компонент выбора цвета
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#000000',
  onChange,
  disabled = false,
  label,
  helperText,
  className
}) => {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    // Проверяем валидность HEX цвета
    if (/^#[0-9A-F]{6}$/i.test(color) || color === '') {
      onChange?.(color);
    }
  };

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Цветовой picker */}
        <input
          type="color"
          value={value}
          onChange={handleColorChange}
          disabled={disabled}
          className={clsx(
            'w-12 h-10 border border-gray-300 rounded-lg cursor-pointer overflow-hidden',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          )}
          title="Выберите цвет"
        />
        
        {/* Текстовое поле для HEX */}
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          placeholder="#000000"
          disabled={disabled}
          className={clsx(
            'flex-1 px-3 py-2 border border-gray-300 rounded-lg transition-colors',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'dark:bg-gray-700 dark:border-gray-600 dark:text-white',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'font-mono text-sm'
          )}
          pattern="^#[0-9A-Fa-f]{6}$"
          maxLength={7}
        />
        
        {/* Превью цвета */}
        <div 
          className="w-10 h-10 border border-gray-300 rounded-lg shadow-inner"
          style={{ backgroundColor: value }}
          title={`Цвет: ${value}`}
        />
      </div>
      
      {helperText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default ColorPicker; 
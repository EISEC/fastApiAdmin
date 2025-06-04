import React from 'react';
import { clsx } from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

/**
 * Компонент многострочного поля ввода
 */
const Textarea: React.FC<TextareaProps> = ({
  error = false,
  label,
  helperText,
  className,
  rows = 3,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <textarea
        rows={rows}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg transition-colors resize-vertical',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'dark:bg-gray-700 dark:border-gray-600 dark:text-white',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300',
          className
        )}
        {...props}
      />
      
      {helperText && (
        <p className={clsx(
          'mt-1 text-sm',
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Textarea; 
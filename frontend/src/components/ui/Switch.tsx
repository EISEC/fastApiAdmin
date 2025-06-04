import React from 'react';
import { clsx } from 'clsx';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Компонент переключателя (switch)
 */
const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  const sizes = {
    sm: {
      switch: 'w-8 h-5',
      thumb: 'w-3 h-3',
      translate: checked ? 'translate-x-3' : 'translate-x-0.5'
    },
    md: {
      switch: 'w-11 h-6',
      thumb: 'w-4 h-4',
      translate: checked ? 'translate-x-5' : 'translate-x-1'
    },
    lg: {
      switch: 'w-14 h-7',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-7' : 'translate-x-1'
    }
  };

  const currentSize = sizes[size];

  return (
    <div className={clsx('flex items-center', className)}>
      <button
        type="button"
        onClick={handleChange}
        disabled={disabled}
        className={clsx(
          'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          currentSize.switch,
          checked 
            ? 'bg-blue-600' 
            : 'bg-gray-200 dark:bg-gray-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={clsx(
            'inline-block bg-white rounded-full shadow-lg transform transition-transform duration-200',
            currentSize.thumb,
            currentSize.translate
          )}
        />
      </button>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Switch; 
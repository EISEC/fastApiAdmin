import React from 'react';
import { clsx } from 'clsx';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string | number | string[];
  onChange?: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  helperText?: string;
  multiple?: boolean;
  className?: string;
}

/**
 * Компонент выпадающего списка
 */
const Select: React.FC<SelectProps> = ({
  value = '',
  onChange,
  options = [],
  placeholder = 'Выберите значение',
  disabled = false,
  error = false,
  label,
  helperText,
  multiple = false,
  className
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (multiple) {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      onChange?.(selectedOptions);
    } else {
      onChange?.(e.target.value);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <select
        value={multiple ? undefined : (value as string | number)}
        onChange={handleChange}
        disabled={disabled}
        multiple={multiple}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg transition-colors bg-white text-gray-900',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300',
          multiple && 'min-h-[120px]',
          className
        )}
      >
        {!multiple && (
          <option value="">{placeholder}</option>
        )}
        
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value} 
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {helperText && (
        <p className={clsx(
          'mt-1 text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Select; 
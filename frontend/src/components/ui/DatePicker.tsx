import React, { useState, useRef, useEffect } from 'react';
import { format, isValid, parse } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DatePickerProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  minDate?: string;
  maxDate?: string;
}

/**
 * Красивый компонент выбора даты с современным дизайном
 */
const DatePicker: React.FC<DatePickerProps> = ({
  id,
  name,
  value = '',
  onChange,
  placeholder = 'Выберите дату',
  disabled = false,
  error = false,
  required = false,
  className = '',
  label,
  helperText,
  errorMessage,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Форматируем дату для отображения
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (isValid(date)) {
        setDisplayValue(format(date, 'dd MMMM yyyy', { locale: ru }));
        setCurrentDate(date);
      } else {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Закрываем календарь при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Генерируем дни месяца
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }
    
    // Добавляем дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateSelect = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const selectedDate = new Date(year, month, day);
    
    // Проверяем ограничения по датам
    if (minDate && selectedDate < new Date(minDate)) return;
    if (maxDate && selectedDate > new Date(maxDate)) return;
    
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    onChange?.(dateString);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isDateSelected = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    if (!isValid(selectedDate)) return false;
    
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentDate.getMonth() &&
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const isDateDisabled = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    
    return false;
  };

  const handleClear = () => {
    onChange?.('');
    setIsOpen(false);
  };

  const inputClasses = `
    w-full px-4 py-3 pr-10 border rounded-xl
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    transition-all duration-200
    ${error ? 'border-red-300 text-red-900' : 'border-gray-300'}
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
    ${className}
  `.trim();

  return (
    <div className="relative" ref={containerRef}>
      {/* Label */}
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={inputClasses}
        />
        
        {/* Calendar Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-lg">✕</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
          >
            <span className="text-lg">📅</span>
          </button>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-gray-600">←</span>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'LLLL yyyy', { locale: ru })}
            </h3>
            
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-gray-600">→</span>
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day, index) => (
              <div key={index} className="aspect-square">
                {day && (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={isDateDisabled(day)}
                    className={`
                      w-full h-full rounded-lg text-sm font-medium transition-all duration-200
                      ${isDateSelected(day)
                        ? 'bg-blue-500 text-white shadow-md'
                        : isDateDisabled(day)
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }
                    `}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                const today = format(new Date(), 'yyyy-MM-dd');
                onChange?.(today);
                setIsOpen(false);
              }}
              className="w-full py-2 px-4 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              📅 Сегодня
            </button>
          </div>
        </div>
      )}

      {/* Helper Text or Error Message */}
      {(helperText || errorMessage) && (
        <div className="mt-2">
          {error && errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : helperText ? (
            <p className="text-sm text-gray-500">{helperText}</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default DatePicker; 
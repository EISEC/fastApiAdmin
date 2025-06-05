import React, { useRef } from 'react';
import { clsx } from 'clsx';
import Icon from './Icon';

interface FileUploadProps {
  value?: string | File;
  onChange?: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  helperText?: string;
  preview?: boolean;
  className?: string;
}

/**
 * Компонент загрузки файлов
 */
const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  accept,
  disabled = false,
  error = false,
  label,
  helperText,
  preview = false,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange?.(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = () => {
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileUrl = (): string | null => {
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    return null;
  };

  const getFileName = (): string => {
    if (value instanceof File) {
      return value.name;
    }
    if (typeof value === 'string') {
      return value.split('/').pop() || value;
    }
    return '';
  };

  const fileUrl = getFileUrl();
  const fileName = getFileName();

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="space-y-3">
        {/* Кнопка загрузки */}
        <div
          onClick={handleClick}
          className={clsx(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors bg-white',
            error 
              ? 'border-red-300 hover:border-red-400' 
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed hover:border-gray-300'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept={accept}
            disabled={disabled}
            className="hidden"
          />
          
          <div className="space-y-2">
            <Icon name="upload" size="2xl" color="gray" className="mx-auto" />
            
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Нажмите для выбора файла
              </span>
              {' или перетащите его сюда'}
            </div>
            
            {accept && (
              <p className="text-xs text-gray-500">
                Поддерживаемые форматы: {accept}
              </p>
            )}
          </div>
        </div>
        
        {/* Превью загруженного файла */}
        {value && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {preview && fileUrl && accept?.includes('image') && (
                <img 
                  src={fileUrl} 
                  alt="Preview" 
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {fileName}
                </p>
                {value instanceof File && (
                  <p className="text-xs text-gray-500">
                    {(value.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Удалить файл"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        )}
      </div>
      
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

export default FileUpload; 
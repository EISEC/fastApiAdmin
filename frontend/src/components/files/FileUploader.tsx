import React, { useState, useRef, useCallback } from 'react';
import type { FileUploadOptions, UploadProgress } from '../../types';
import { useFilesStore } from '../../store/filesStore';
import { MAX_FILE_SIZE, FILE_TYPE_EXTENSIONS } from '../../types/file.types';
import Icon from '../ui/Icon';

interface FileUploaderProps {
  folderId?: string;
  options?: FileUploadOptions;
  onUploadComplete?: (files: string[]) => void;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  folderId,
  options = {},
  onUploadComplete,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFiles, uploadProgress } = useFilesStore();

  // Валидация файлов
  const validateFile = (file: File): string | null => {
    // Проверка размера
    const maxSize = options.maxSize || MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return `Файл "${file.name}" слишком большой. Максимальный размер: ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    // Проверка типа файла
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
      if (!options.allowedTypes.includes(fileExtension)) {
        return `Тип файла "${fileExtension}" не поддерживается`;
      }
    }

    return null;
  };

  // Обработка выбранных файлов
  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Валидация всех файлов
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    // Показываем ошибки если есть
    if (errors.length > 0) {
      alert(`Ошибки при загрузке:\n${errors.join('\n')}`);
    }

    // Загружаем валидные файлы
    if (validFiles.length > 0) {
      await uploadFiles(validFiles, folderId);
      
      if (onUploadComplete) {
        // В реальном проекте здесь будут ID загруженных файлов
        const uploadedFileIds = validFiles.map((_, index) => `uploaded_${Date.now()}_${index}`);
        onUploadComplete(uploadedFileIds);
      }
    }
  }, [uploadFiles, folderId, options, onUploadComplete]);

  // Drag & Drop обработчики
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setIsDragOver(false);
        return 0;
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Обработчик клика по области загрузки
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Обработчик выбора файлов через input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Очищаем input для повторной загрузки тех же файлов
    e.target.value = '';
  };

  // Получаем список допустимых расширений для отображения
  const getAllowedExtensions = (): string[] => {
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      return options.allowedTypes;
    }
    
    // Если не указаны конкретные типы, возвращаем все поддерживаемые
    return Object.values(FILE_TYPE_EXTENSIONS).flat();
  };

  const allowedExtensions = getAllowedExtensions();
  const maxSizeMB = Math.round((options.maxSize || MAX_FILE_SIZE) / 1024 / 1024);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Область загрузки */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Скрытый input для выбора файлов */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
          accept={allowedExtensions.map(ext => `.${ext}`).join(',')}
        />

        {/* Иконка и текст */}
        <div className="space-y-2">
          <Icon name="upload" size="2xl" className="mx-auto text-gray-400" />
          <div className="text-lg font-medium text-gray-900">
            {isDragOver ? 'Отпустите файлы для загрузки' : 'Перетащите файлы сюда'}
          </div>
          <div className="text-sm text-gray-500">
            или{' '}
            <span className="text-blue-600 hover:text-blue-700 font-medium">
              выберите файлы
            </span>
          </div>
          
          {/* Информация о ограничениях */}
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>Максимальный размер файла: {maxSizeMB}MB</div>
            {options.allowedTypes && options.allowedTypes.length > 0 && (
              <div>
                Поддерживаемые форматы: {options.allowedTypes.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Прогресс загрузки */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Загрузка файлов:</h4>
          {uploadProgress.map((progress) => (
            <UploadProgressItem key={progress.fileId} progress={progress} />
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент прогресс-бара для отдельного файла
interface UploadProgressItemProps {
  progress: UploadProgress;
}

const UploadProgressItem: React.FC<UploadProgressItemProps> = ({ progress }) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'uploading':
        return <Icon name="refresh" size="md" className="animate-spin text-blue-600" />;
      case 'processing':
        return <Icon name="refresh" size="md" className="animate-spin text-blue-600" />;
      case 'completed':
        return <Icon name="check" size="md" color="success" />;
      case 'error':
        return <Icon name="cancel" size="md" color="danger" />;
      default:
        return <Icon name="file" size="md" color="gray" />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'uploading':
        return 'Загрузка...';
      case 'processing':
        return 'Обработка...';
      case 'completed':
        return 'Завершено';
      case 'error':
        return progress.error || 'Ошибка';
      default:
        return 'В очереди';
    }
  };

  const getProgressColor = () => {
    switch (progress.status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-600';
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      {/* Иконка статуса */}
      <div className="flex-shrink-0">{getStatusIcon()}</div>
      
      {/* Информация о файле */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {progress.fileName}
        </div>
        <div className="text-xs text-gray-500">
          {getStatusText()}
        </div>
      </div>
      
      {/* Прогресс-бар */}
      <div className="w-20">
        {progress.status === 'uploading' || progress.status === 'processing' ? (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        ) : (
          <div className={`w-full h-2 rounded-full ${getProgressColor()}`} />
        )}
      </div>
      
      {/* Процент выполнения */}
      <div className="text-xs text-gray-500 w-10 text-right">
        {progress.status === 'uploading' || progress.status === 'processing' 
          ? `${progress.progress}%` 
          : ''
        }
      </div>
    </div>
  );
};

export default FileUploader; 
import React, { useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import Icon from './Icon';
import { useToastStore } from '../../store/toastStore';
import { api } from '../../lib/axios.config';
// Импорты утилит можно добавить при необходимости для диагностики

interface CloudFileUploadProps {
  value?: string; // URL загруженного файла
  onChange?: (url: string | null) => void;
  accept?: string;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  helperText?: string;
  preview?: boolean;
  className?: string;
  siteId?: number; // ID сайта для определения настроек storage
  maxSize?: number; // Максимальный размер файла в байтах (по умолчанию 10MB)
  multiple?: boolean; // Поддержка множественной загрузки
}

interface UploadResponse {
  url: string;
  path: string;
  name: string;
  size: number;
  type?: string;
}

/**
 * Улучшенный компонент загрузки файлов напрямую в облачное хранилище
 * Поддерживает drag&drop, превью разных типов файлов, валидацию размера
 */
const CloudFileUpload: React.FC<CloudFileUploadProps> = ({
  value,
  onChange,
  accept,
  disabled = false,
  error = false,
  label,
  helperText,
  preview = true,
  className,
  siteId,
  maxSize = 10 * 1024 * 1024, // 10MB по умолчанию
  multiple = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageLoading, setImageLoading] = useState(true); // Новое состояние для загрузки изображения
  const [imageError, setImageError] = useState(false); // Новое состояние для ошибки загрузки изображения
  const { success: showSuccessToast, error: showErrorToast } = useToastStore();

  const uploadToCloud = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (siteId) {
      formData.append('site_id', siteId.toString());
    }

    return api.upload<UploadResponse>('/files/upload-to-cloud/', formData);
  };

  const validateFile = (file: File): string | null => {
    // Проверка размера файла
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `Размер файла превышает ${maxSizeMB}MB`;
    }

    // Проверка типа файла
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const mimeType = file.type;
      
      const isAccepted = acceptedTypes.some(acceptedType => {
        if (acceptedType.startsWith('.')) {
          return fileExtension === acceptedType;
        }
        if (acceptedType.includes('*')) {
          const baseType = acceptedType.split('/')[0];
          return mimeType.startsWith(baseType);
        }
        return mimeType === acceptedType;
      });

      if (!isAccepted) {
        return `Неподдерживаемый тип файла. Разрешены: ${accept}`;
      }
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      showErrorToast('Ошибка валидации', validationError);
      return;
    }

    setUploading(true);
    
    try {
      console.log('🚀 Uploading file to cloud:', file.name, `(${(file.size / 1024).toFixed(1)}KB)`);
      const uploadResult = await uploadToCloud(file);
      
      console.log('✅ File uploaded successfully:', uploadResult.url);
      onChange?.(uploadResult.url);
      
      showSuccessToast(
        'Файл загружен',
        `Файл "${file.name}" успешно загружен в облако`
      );
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      showErrorToast(
        'Ошибка загрузки',
        error instanceof Error ? error.message : 'Ошибка загрузки файла'
      );
      
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      onChange?.(null);
      return;
    }

    const file = files[0]; // Пока поддерживаем только один файл
    await handleFileUpload(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0]; // Пока поддерживаем только один файл
    await handleFileUpload(file);
  }, [disabled, uploading]);

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    
    try {
      // Показываем индикатор удаления
      setDeleting(true);
      
      // Удаляем файл из облачного хранилища
      const result = await api.delete<{detail: string; deleted_path?: string}>(`/media/delete/?url=${encodeURIComponent(value)}`);
      
      console.log('✅ Файл успешно удален из облака:', result);
      
      // Очищаем поле формы
      onChange?.(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Сбрасываем состояния изображения
      setImageLoading(true);
      setImageError(false);
      
      showSuccessToast(
        'Файл удален',
        'Файл успешно удален из облачного хранилища'
      );
      
    } catch (error: any) {
      console.error('❌ Ошибка удаления файла из облака:', error);
      
      // Если файл не найден в облаке (404), все равно очищаем поле
      if (error.response?.status === 404) {
        console.log('⚠️ Файл не найден в облаке, очищаем поле формы');
        onChange?.(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setImageLoading(true);
        setImageError(false);
        
        showSuccessToast(
          'Поле очищено',
          'Файл не найден в облаке, поле формы очищено'
        );
      } else {
        // Для других ошибок показываем уведомление
        showErrorToast(
          'Ошибка удаления',
          error.response?.data?.detail || 'Не удалось удалить файл из облака'
        );
        console.error('Детали ошибки:', error.response?.data);
      }
    } finally {
      setDeleting(false);
    }
  };

  const getFileInfo = () => {
    if (!value) return null;

    const fileName = value.split('/').pop() || value;
    const fileExtension = (fileName.split('.').pop() || '').toLowerCase();
    
    return {
      name: fileName,
      extension: fileExtension,
      isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension),
      isVideo: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(fileExtension),
      isAudio: ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(fileExtension),
      isPdf: fileExtension === 'pdf',
      isDocument: ['doc', 'docx', 'txt', 'rtf'].includes(fileExtension),
      isSpreadsheet: ['xls', 'xlsx', 'csv'].includes(fileExtension),
      isArchive: ['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExtension)
    };
  };

  const getFileIcon = (fileInfo: ReturnType<typeof getFileInfo>) => {
    if (!fileInfo) return 'file';
    
    if (fileInfo.isImage) return 'image';
    if (fileInfo.isVideo) return 'video';
    if (fileInfo.isAudio) return 'fileAudio';
    if (fileInfo.isPdf) return 'pdf';
    if (fileInfo.isDocument) return 'file';
    if (fileInfo.isSpreadsheet) return 'file';
    if (fileInfo.isArchive) return 'fileZip';
    
    return 'file';
  };

  const formatFileSize = (url: string): string => {
    // Пока не можем получить размер из URL, показываем заглушку
    return 'Загружен в облако';
  };

  const fileInfo = getFileInfo();
  const hasFile = Boolean(value);

  // Сбрасываем состояния изображения при изменении URL
  React.useEffect(() => {
    if (value) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [value]);

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="space-y-4">
        {/* Область загрузки */}
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={clsx(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 bg-white',
            dragOver && 'border-blue-400 bg-blue-50 scale-[1.02]',
            error && !dragOver
              ? 'border-red-300 hover:border-red-400' 
              : 'border-gray-300 hover:border-gray-400',
            !dragOver && !error && 'hover:bg-gray-50',
            (disabled || uploading) && 'opacity-50 cursor-not-allowed hover:border-gray-300 hover:bg-white'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept={accept}
            disabled={disabled || uploading}
            multiple={multiple}
            className="hidden"
          />
          
          <div className="space-y-3">
            {uploading ? (
              <>
                <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">
                    Загрузка в облако...
                  </span>
                </div>
              </>
            ) : (
              <>
                <Icon 
                  name={dragOver ? "download" : "upload"} 
                  size="2xl" 
                  color={dragOver ? "primary" : "gray"} 
                  className="mx-auto" 
                />
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    {dragOver ? 'Отпустите для загрузки' : 'Нажмите для выбора файла'}
                  </span>
                  {!dragOver && ' или перетащите его сюда'}
                </div>
                
                <div className="text-xs text-gray-500">
                  Файл будет загружен в Yandex Object Storage
                </div>
              </>
            )}
            
            {accept && !uploading && (
              <p className="text-xs text-gray-500">
                Поддерживаемые форматы: {accept.replace(/\./g, '').toUpperCase()}
              </p>
            )}
            
            {maxSize && !uploading && (
              <p className="text-xs text-gray-500">
                Максимальный размер: {(maxSize / (1024 * 1024)).toFixed(1)}MB
              </p>
            )}
          </div>
        </div>
        
        {/* Превью загруженного файла */}
        {hasFile && fileInfo && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                
                {/* Превью файла */}
                <div className="flex-shrink-0">
                  {preview && fileInfo.isImage ? (
                    <div className="relative w-12 h-12">
                      {/* Индикатор загрузки */}
                      {imageLoading && !imageError && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      
                      {/* Изображение */}
                      <img 
                        src={value} 
                        alt="Preview" 
                        className={clsx(
                          "w-full h-full object-cover rounded-lg border border-gray-200 transition-opacity duration-200",
                          imageLoading || imageError ? "opacity-0" : "opacity-100"
                        )}
                        onLoad={() => {
                          setImageLoading(false);
                          setImageError(false);
                        }}
                        onError={() => {
                          setImageLoading(false);
                          setImageError(true);
                        }}
                      />
                      
                      {/* Fallback иконка при ошибке - простая иконка без текста */}
                      {imageError && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <Icon name="image" size="md" color="gray" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                      <Icon name={getFileIcon(fileInfo)} size="md" color="primary" />
                    </div>
                  )}
                </div>
                
                {/* Информация о файле */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={fileInfo.name}>
                    {fileInfo.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <Icon name="check" size="xs" className="inline mr-1 text-green-500" />
                    Загружен в облако
                  </p>
                </div>
              </div>
              
              {/* Кнопка удаления */}
              <button
                onClick={handleRemove}
                disabled={disabled || uploading || deleting}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                title={deleting ? "Удаление из облака..." : "Удалить файл из облака"}
              >
                {deleting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                ) : (
                  <Icon name="close" size="sm" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {helperText && (
        <p className={clsx(
          'mt-2 text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default CloudFileUpload; 
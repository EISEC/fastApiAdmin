import React from 'react';
import type { FileItem, FileType } from '../../types';
import { formatFileSize } from '../../store/filesStore';

interface FileThumbnailProps {
  file: FileItem;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  showName?: boolean;
  showSize?: boolean;
  showSelect?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

// Иконки для разных типов файлов
const getFileIcon = (type: FileType, mimeType?: string): string => {
  switch (type) {
    case 'image':
      return '🖼️';
    case 'video':
      return '🎬';
    case 'audio':
      return '🎵';
    case 'document':
      if (mimeType?.includes('pdf')) return '📄';
      if (mimeType?.includes('word')) return '📝';
      if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return '📊';
      if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📽️';
      return '📄';
    case 'archive':
      return '🗜️';
    default:
      return '📁';
  }
};

const FileThumbnail: React.FC<FileThumbnailProps> = ({
  file,
  size = 'md',
  onClick,
  onDoubleClick,
  className = '',
  showName = true,
  showSize = false,
  showSelect = false,
  isSelected = false,
  onSelect
}) => {
  // Размеры компонента
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };
  
  // Размеры превью
  const previewSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36'
  };
  
  // Размеры текста
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showSelect && onSelect) {
      onSelect(!isSelected);
    } else if (onClick) {
      onClick();
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(e.target.checked);
    }
  };

  const renderPreview = () => {
    if (file.type === 'image') {
      return (
        <img
          src={file.url}
          alt={file.metadata.altText || file.name}
          className={`${previewSizes[size]} object-cover rounded-lg border-2 border-gray-200`}
          onError={(e) => {
            // Если изображение не загрузилось, показываем иконку
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    
    // Для всех остальных типов файлов показываем иконку
    return (
      <div className={`${previewSizes[size]} flex items-center justify-center bg-gray-100 rounded-lg border-2 border-gray-200`}>
        <span className={iconSizes[size]} role="img" aria-label={file.type}>
          {getFileIcon(file.type, file.mimeType)}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} p-2 rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${className}
      `}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Чекбокс для выбора */}
      {showSelect && (
        <div className="flex justify-end mb-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      {/* Превью файла */}
      <div className="flex justify-center mb-2">
        {renderPreview()}
        {/* Скрытая иконка для fallback изображений */}
        {file.type === 'image' && (
          <div className={`${previewSizes[size]} hidden flex items-center justify-center bg-gray-100 rounded-lg border-2 border-gray-200`}>
            <span className={iconSizes[size]} role="img" aria-label="broken image">
              🖼️
            </span>
          </div>
        )}
      </div>

      {/* Информация о файле */}
      {showName && (
        <div className="text-center">
          <h3 
            className={`${textSizes[size]} font-medium text-gray-900 truncate`}
            title={file.metadata.title || file.name}
          >
            {file.metadata.title || file.name}
          </h3>
          
          {showSize && (
            <p className={`${textSizes[size]} text-gray-500 mt-1`}>
              {formatFileSize(file.size)}
            </p>
          )}
          
          {/* Теги файла */}
          {file.metadata.tags && file.metadata.tags.length > 0 && size !== 'sm' && (
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {file.metadata.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {file.metadata.tags.length > 2 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{file.metadata.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Дополнительная информация для больших размеров */}
      {size === 'lg' && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          <div>{file.type.toUpperCase()}</div>
          {file.metadata.dimensions && (
            <div>{file.metadata.dimensions.width}×{file.metadata.dimensions.height}</div>
          )}
          <div>{new Date(file.createdAt).toLocaleDateString('ru-RU')}</div>
        </div>
      )}
    </div>
  );
};

export default FileThumbnail; 
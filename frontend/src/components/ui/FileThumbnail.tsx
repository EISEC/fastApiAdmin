import React from 'react';
import { clsx } from 'clsx';
import Icon from './Icon';

interface FileThumbnailProps {
  url: string;
  fileName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Компонент для отображения превью файлов разных типов
 */
const FileThumbnail: React.FC<FileThumbnailProps> = ({
  url,
  fileName,
  size = 'md',
  showName = false,
  className,
  onClick
}) => {
  const getFileInfo = () => {
    const name = fileName || url.split('/').pop() || url;
    const extension = (name.split('.').pop() || '').toLowerCase();
    
    return {
      name,
      extension,
      isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension),
      isVideo: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension),
      isAudio: ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(extension),
      isPdf: extension === 'pdf',
      isDocument: ['doc', 'docx', 'txt', 'rtf'].includes(extension),
      isSpreadsheet: ['xls', 'xlsx', 'csv'].includes(extension),
      isArchive: ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)
    };
  };

  const getFileIcon = (fileInfo: ReturnType<typeof getFileInfo>) => {
    if (fileInfo.isImage) return 'image';
    if (fileInfo.isVideo) return 'video';
    if (fileInfo.isAudio) return 'fileAudio';
    if (fileInfo.isPdf) return 'pdf';
    if (fileInfo.isDocument) return 'file';
    if (fileInfo.isSpreadsheet) return 'file';
    if (fileInfo.isArchive) return 'fileZip';
    return 'file';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'md':
        return 'w-16 h-16';
      case 'lg':
        return 'w-24 h-24';
      case 'xl':
        return 'w-32 h-32';
      default:
        return 'w-16 h-16';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'md';
      case 'md':
        return 'lg';
      case 'lg':
        return 'xl';
      case 'xl':
        return '2xl';
      default:
        return 'lg';
    }
  };

  const fileInfo = getFileInfo();
  const sizeClasses = getSizeClasses();
  const iconSize = getIconSize();

  return (
    <div 
      className={clsx(
        'flex flex-col items-center space-y-2',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {/* Превью файла */}
      <div className={clsx(
        sizeClasses,
        'relative rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center'
      )}>
        {fileInfo.isImage ? (
          <>
            <img 
              src={url} 
              alt={fileInfo.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback на иконку если изображение не загружается
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
            <div className="hidden w-full h-full bg-gray-100 flex items-center justify-center">
              <Icon name="image" size={iconSize} color="gray" />
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <Icon name={getFileIcon(fileInfo)} size={iconSize} color="primary" />
          </div>
        )}

        {/* Индикатор типа файла для видео и аудио */}
        {fileInfo.isVideo && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <Icon name="play" size="lg" color="white" />
          </div>
        )}
        
        {fileInfo.isAudio && (
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 rounded px-1">
            <Icon name="volumeHigh" size="xs" color="white" />
          </div>
        )}
      </div>

      {/* Название файла */}
      {showName && (
        <p className={clsx(
          'text-center text-gray-700 truncate max-w-full',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {fileInfo.name}
        </p>
      )}
    </div>
  );
};

export default FileThumbnail; 
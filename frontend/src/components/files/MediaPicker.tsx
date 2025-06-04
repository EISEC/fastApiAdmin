import React, { useState } from 'react';
import type { MediaPickerOptions, FileItem } from '../../types';
import FileManager from './FileManager';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface MediaPickerProps extends MediaPickerOptions {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  onCancel,
  multiple = false,
  accept,
  maxSize,
  title = 'Выбор медиа-файлов'
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

  const handleFileSelect = (files: FileItem[]) => {
    setSelectedFiles(files);
  };

  const handleConfirm = () => {
    onSelect(selectedFiles);
    setSelectedFiles([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  // Фильтрация по типам файлов
  const getAcceptedTypes = (): string[] => {
    if (!accept || accept.length === 0) return [];
    
    // Преобразуем типы файлов в расширения
    const extensions: string[] = [];
    accept.forEach(type => {
      switch (type) {
        case 'image':
          extensions.push('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg');
          break;
        case 'video':
          extensions.push('mp4', 'mov', 'avi', 'mkv', 'webm');
          break;
        case 'audio':
          extensions.push('mp3', 'wav', 'ogg', 'aac', 'flac');
          break;
        case 'document':
          extensions.push('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx');
          break;
        case 'archive':
          extensions.push('zip', 'rar', '7z', 'tar', 'gz');
          break;
      }
    });
    
    return extensions;
  };

  const acceptedExtensions = getAcceptedTypes();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="xl"
    >
      <div className="flex flex-col h-[80vh]">
        {/* Информация о выборе */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {multiple ? 'Выберите один или несколько файлов' : 'Выберите файл'}
              {accept && accept.length > 0 && (
                <span className="ml-2">
                  • Только: {accept.map(type => {
                    switch (type) {
                      case 'image': return '🖼️ изображения';
                      case 'video': return '🎬 видео';
                      case 'audio': return '🎵 аудио';
                      case 'document': return '📄 документы';
                      case 'archive': return '🗜️ архивы';
                      default: return type;
                    }
                  }).join(', ')}
                </span>
              )}
              {maxSize && (
                <span className="ml-2">
                  • Макс. размер: {Math.round(maxSize / 1024 / 1024)}MB
                </span>
              )}
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="text-sm font-medium text-blue-600">
                Выбрано: {selectedFiles.length} {multiple ? 'файл(ов)' : 'файл'}
              </div>
            )}
          </div>
        </div>

        {/* Файловый менеджер */}
        <div className="flex-1 min-h-0">
          <FileManager
            onFileSelect={handleFileSelect}
            selectionMode={multiple ? 'multiple' : 'single'}
            accept={acceptedExtensions}
            className="h-full"
          />
        </div>

        {/* Превью выбранных файлов */}
        {selectedFiles.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Выбранные файлы:
            </h4>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {selectedFiles.map((file) => (
                <SelectedFilePreview
                  key={file.id}
                  file={file}
                  onRemove={() => {
                    const newSelection = selectedFiles.filter(f => f.id !== file.id);
                    setSelectedFiles(newSelection);
                    handleFileSelect(newSelection);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <Button
            onClick={handleCancel}
            variant="secondary"
          >
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            disabled={selectedFiles.length === 0}
          >
            Выбрать {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Компонент превью выбранного файла
interface SelectedFilePreviewProps {
  file: FileItem;
  onRemove: () => void;
}

const SelectedFilePreview: React.FC<SelectedFilePreviewProps> = ({
  file,
  onRemove
}) => {
  const getFileIcon = (type: string): string => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      case 'archive':
        return '🗜️';
      default:
        return '📁';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="relative flex items-center bg-white border border-gray-200 rounded-lg p-2 pr-8 min-w-0">
      {/* Превью или иконка */}
      <div className="flex-shrink-0 w-8 h-8 mr-2">
        {file.type === 'image' ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-8 h-8 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const icon = e.currentTarget.nextElementSibling as HTMLElement;
              if (icon) icon.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-8 h-8 flex items-center justify-center text-lg ${file.type === 'image' ? 'hidden' : ''}`}
        >
          {getFileIcon(file.type)}
        </div>
      </div>

      {/* Информация о файле */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">
          {file.metadata.title || file.name}
        </div>
        <div className="text-xs text-gray-500">
          {formatFileSize(file.size)}
        </div>
      </div>

      {/* Кнопка удаления */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
        title="Убрать из выбора"
      >
        ✕
      </button>
    </div>
  );
};

export default MediaPicker; 
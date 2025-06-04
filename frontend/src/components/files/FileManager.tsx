import React, { useState, useEffect } from 'react';
import type { FileItem, FolderItem, FileFilter, FileSort } from '../../types';
import { useFilesStore } from '../../store/filesStore';
import FileThumbnail from './FileThumbnail';
import FileUploader from './FileUploader';
import Button from '../ui/Button';

interface FileManagerProps {
  onFileSelect?: (files: FileItem[]) => void;
  selectionMode?: 'single' | 'multiple';
  accept?: string[];
  className?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  onFileSelect,
  selectionMode = 'multiple',
  accept,
  className = ''
}) => {
  const [showUploader, setShowUploader] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  const {
    files,
    folders,
    selectedFiles,
    selectedFolder,
    currentPath,
    filter,
    sort,
    viewMode,
    isLoading,
    error,
    fetchFiles,
    fetchFolders,
    selectFiles,
    selectFolder,
    setFilter,
    setSort,
    setViewMode,
    createFolder,
    deleteFiles,
    clearSelection,
    clearError
  } = useFilesStore();

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchFolders();
    fetchFiles();
  }, [fetchFolders, fetchFiles]);

  // Обновляем фильтр при изменении поиска
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilter({ search: searchTerm || undefined });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, setFilter]);

  // Фильтрация файлов по типу
  const filteredFiles = files.filter(file => {
    if (selectedTypeFilter === 'all') return true;
    return file.type === selectedTypeFilter;
  });

  // Построение дерева папок
  const buildFolderTree = (folders: FolderItem[], parentId?: string): FolderItem[] => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .map(folder => ({
        ...folder,
        children: buildFolderTree(folders, folder.id)
      }));
  };

  const folderTree = buildFolderTree(folders);

  // Обработчики
  const handleFileSelect = (fileId: string, selected: boolean) => {
    let newSelection: string[];
    
    if (selectionMode === 'single') {
      newSelection = selected ? [fileId] : [];
    } else {
      if (selected) {
        newSelection = [...selectedFiles, fileId];
      } else {
        newSelection = selectedFiles.filter(id => id !== fileId);
      }
    }
    
    selectFiles(newSelection);
    
    // Уведомляем родительский компонент
    if (onFileSelect) {
      const selectedFileObjects = files.filter(file => newSelection.includes(file.id));
      onFileSelect(selectedFileObjects);
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      clearSelection();
    } else {
      const allFileIds = filteredFiles.map(file => file.id);
      selectFiles(allFileIds);
      
      if (onFileSelect) {
        onFileSelect(filteredFiles);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return;
    
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить ${selectedFiles.length} файл(ов)?`
    );
    
    if (confirmed) {
      await deleteFiles(selectedFiles);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Введите название папки:');
    if (name && name.trim()) {
      await createFolder(name.trim(), selectedFolder || undefined);
    }
  };

  const handleSortChange = (field: string) => {
    const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    setSort({ field: field as any, direction: newDirection });
  };

  return (
    <div className={`flex h-full bg-white ${className}`}>
      {/* Левая панель - дерево папок */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Файлы</h2>
          <Button
            onClick={() => setShowUploader(!showUploader)}
            variant="primary"
            size="sm"
            className="mt-2 w-full"
          >
            📤 Загрузить файлы
          </Button>
        </div>
        
        {/* Дерево папок */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {/* Корневая папка */}
            <div
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedFolder === null 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => selectFolder(null)}
            >
              📁 Все файлы
            </div>
            
            {/* Дерево папок */}
            <FolderTreeNode 
              folders={folderTree} 
              selectedFolder={selectedFolder}
              onSelectFolder={selectFolder}
              level={0}
            />
          </div>
        </div>
        
        {/* Кнопки управления папками */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            onClick={handleCreateFolder}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            📁 Создать папку
          </Button>
        </div>
      </div>

      {/* Правая панель - содержимое */}
      <div className="flex-1 flex flex-col">
        {/* Панель инструментов */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Поиск и фильтры */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Поиск файлов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все типы</option>
              <option value="image">🖼️ Изображения</option>
              <option value="video">🎬 Видео</option>
              <option value="audio">🎵 Аудио</option>
              <option value="document">📄 Документы</option>
              <option value="archive">🗜️ Архивы</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-900' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-900' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                ☰
              </button>
            </div>
          </div>
          
          {/* Действия с выбранными файлами */}
          {selectedFiles.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
              <span className="text-sm text-blue-900">
                Выбрано файлов: {selectedFiles.length}
              </span>
              <div className="space-x-2">
                <Button
                  onClick={handleDeleteSelected}
                  variant="danger"
                  size="sm"
                >
                  🗑️ Удалить
                </Button>
                <Button
                  onClick={clearSelection}
                  variant="secondary"
                  size="sm"
                >
                  Отменить выбор
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Загрузчик файлов */}
        {showUploader && (
          <div className="p-4 border-b border-gray-200">
            <FileUploader
              folderId={selectedFolder || undefined}
              options={{
                allowedTypes: accept,
                maxSize: 50 * 1024 * 1024 // 50MB
              }}
              onUploadComplete={() => {
                setShowUploader(false);
                fetchFiles(selectedFolder || undefined);
              }}
            />
          </div>
        )}

        {/* Содержимое файлов */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-red-800">{error}</span>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-500">Загрузка...</div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-6xl mb-4">📁</div>
              <div className="text-lg">Файлы не найдены</div>
              <div className="text-sm">
                {filter.search ? 'Попробуйте изменить поисковый запрос' : 'Загрузите первые файлы'}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Кнопка "Выбрать все" в режиме сетки */}
              {selectionMode === 'multiple' && (
                <div className="col-span-full mb-4">
                  <Button
                    onClick={handleSelectAll}
                    variant="secondary"
                    size="sm"
                  >
                    {selectedFiles.length === filteredFiles.length ? 'Отменить выбор всех' : 'Выбрать все'}
                  </Button>
                </div>
              )}
              
              {filteredFiles.map((file) => (
                <FileThumbnail
                  key={file.id}
                  file={file}
                  size="md"
                  showSelect={true}
                  showSize={true}
                  isSelected={selectedFiles.includes(file.id)}
                  onSelect={(selected) => handleFileSelect(file.id, selected)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Заголовки таблицы */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-md text-sm font-medium text-gray-700">
                <div className="col-span-1">
                  {selectionMode === 'multiple' && (
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  )}
                </div>
                <div className="col-span-4 cursor-pointer" onClick={() => handleSortChange('name')}>
                  Название {sort.field === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
                </div>
                <div className="col-span-2 cursor-pointer" onClick={() => handleSortChange('type')}>
                  Тип {sort.field === 'type' && (sort.direction === 'asc' ? '↑' : '↓')}
                </div>
                <div className="col-span-2 cursor-pointer" onClick={() => handleSortChange('size')}>
                  Размер {sort.field === 'size' && (sort.direction === 'asc' ? '↑' : '↓')}
                </div>
                <div className="col-span-3 cursor-pointer" onClick={() => handleSortChange('createdAt')}>
                  Дата создания {sort.field === 'createdAt' && (sort.direction === 'asc' ? '↑' : '↓')}
                </div>
              </div>
              
              {/* Строки файлов */}
              {filteredFiles.map((file) => (
                <FileListItem
                  key={file.id}
                  file={file}
                  isSelected={selectedFiles.includes(file.id)}
                  onSelect={(selected) => handleFileSelect(file.id, selected)}
                  showSelect={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент узла дерева папок
interface FolderTreeNodeProps {
  folders: FolderItem[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  level: number;
}

const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  level
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (expandedFolders.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <>
      {folders.map((folder) => (
        <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
          <div className="flex items-center">
            {folder.children && folder.children.length > 0 && (
              <button
                onClick={() => toggleExpanded(folder.id)}
                className="w-4 h-4 mr-1 text-gray-500 hover:text-gray-700"
              >
                {expandedFolders.has(folder.id) ? '▼' : '▶'}
              </button>
            )}
            <div
              className={`flex-1 p-2 rounded cursor-pointer transition-colors ${
                selectedFolder === folder.id 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectFolder(folder.id)}
            >
              📁 {folder.name} ({folder.filesCount})
            </div>
          </div>
          
          {folder.children && expandedFolders.has(folder.id) && (
            <FolderTreeNode
              folders={folder.children}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </>
  );
};

// Компонент строки файла в списочном виде
interface FileListItemProps {
  file: FileItem;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  showSelect: boolean;
}

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  isSelected,
  onSelect,
  showSelect
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`grid grid-cols-12 gap-4 p-3 rounded-md border transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="col-span-1">
        {showSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        )}
      </div>
      
      <div className="col-span-4 flex items-center space-x-3">
        <FileThumbnail
          file={file}
          size="sm"
          showName={false}
          className="w-8 h-8"
        />
        <div>
          <div className="font-medium text-gray-900">{file.metadata.title || file.name}</div>
          {file.metadata.description && (
            <div className="text-xs text-gray-500 truncate">{file.metadata.description}</div>
          )}
        </div>
      </div>
      
      <div className="col-span-2 flex items-center">
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
          {file.type.toUpperCase()}
        </span>
      </div>
      
      <div className="col-span-2 flex items-center text-sm text-gray-600">
        {formatFileSize(file.size)}
      </div>
      
      <div className="col-span-3 flex items-center text-sm text-gray-600">
        {new Date(file.createdAt).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};

export default FileManager; 
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FileManager } from '../components/files';
import { CloudFileUpload, FileThumbnail, Button, Card, Badge } from '../components/ui';
import { useSitesStore } from '../store';
import Icon from '../components/ui/Icon';
import { clsx } from 'clsx';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  siteId: number;
  siteName: string;
  createdAt: string;
  thumbnailUrl?: string;
}

const MediaLibrary: React.FC = () => {
  const { sites, fetchSites } = useSitesStore();
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [showUploader, setShowUploader] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Загружаем сайты при монтировании
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Устанавливаем первый сайт по умолчанию
  useEffect(() => {
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0].id);
    }
  }, [sites, selectedSite]);

  // Фильтрация файлов
  const filteredFiles = mediaFiles.filter(file => {
    const matchesSite = !selectedSite || file.siteId === selectedSite;
    const matchesSearch = !searchTerm || file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || file.type.startsWith(fileTypeFilter);
    
    return matchesSite && matchesSearch && matchesType;
  });

  // Статистика файлов
  const fileStats = {
    total: filteredFiles.length,
    images: filteredFiles.filter(f => f.type.startsWith('image')).length,
    videos: filteredFiles.filter(f => f.type.startsWith('video')).length,
    documents: filteredFiles.filter(f => !f.type.startsWith('image') && !f.type.startsWith('video')).length,
    totalSize: filteredFiles.reduce((sum, f) => sum + f.size, 0)
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (url: string | null) => {
    if (url && selectedSite) {
      // Добавляем новый файл в список (в реальном приложении это будет загружаться с сервера)
      const newFile: MediaFile = {
        id: Date.now().toString(),
        name: url.split('/').pop() || 'Новый файл',
        url,
        type: 'image/jpeg', // Определяем тип по расширению
        size: 0, // Размер пока неизвестен
        siteId: selectedSite,
        siteName: sites.find(s => s.id === selectedSite)?.name || '',
        createdAt: new Date().toISOString(),
        thumbnailUrl: url
      };
      
      setMediaFiles(prev => [newFile, ...prev]);
      setShowUploader(false);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.length === 0) return;
    
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить ${selectedFiles.length} файл(ов)?`
    );
    
    if (confirmed) {
      setMediaFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)));
      setSelectedFiles([]);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок и статистика */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Icon name="folder" size="lg" className="mr-3" />
                Медиа-библиотека
              </h1>
              <p className="text-gray-600 mt-1">
                Управление файлами в Yandex Object Storage
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowUploader(!showUploader)}
                variant="primary"
              >
                <Icon name="upload" size="sm" className="mr-2" />
                Загрузить файлы
              </Button>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Icon name="file" size="lg" color="primary" className="mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Всего файлов</p>
                  <p className="text-2xl font-bold text-blue-600">{fileStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Icon name="image" size="lg" color="success" className="mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Изображения</p>
                  <p className="text-2xl font-bold text-green-600">{fileStats.images}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Icon name="video" size="lg" color="secondary" className="mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Видео</p>
                  <p className="text-2xl font-bold text-purple-600">{fileStats.videos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Icon name="database" size="lg" color="warning" className="mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Общий размер</p>
                  <p className="text-2xl font-bold text-orange-600">{formatFileSize(fileStats.totalSize)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Загрузчик файлов */}
        {showUploader && (
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Загрузка файлов
              </h3>
            </div>
            
            <CloudFileUpload
              label="Выберите файлы для загрузки"
              accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
              maxSize={50 * 1024 * 1024} // 50MB
              preview={true}
              siteId={selectedSite || undefined}
              onChange={handleFileUpload}
              helperText="Поддерживаемые форматы: изображения, видео, документы до 50MB"
            />
          </Card>
        )}

        {/* Фильтры и управление */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Фильтры */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Выбор сайта */}
              <div className="flex items-center space-x-2">
                <Icon name="globe" size="sm" color="gray" />
                <select
                  value={selectedSite || ''}
                  onChange={(e) => setSelectedSite(e.target.value ? Number(e.target.value) : null)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все сайты</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Поиск */}
              <div className="flex items-center space-x-2">
                <Icon name="search" size="sm" color="gray" />
                <input
                  type="text"
                  placeholder="Поиск файлов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Фильтр по типу */}
              <div className="flex items-center space-x-2">
                <Icon name="filter" size="sm" color="gray" />
                <select
                  value={fileTypeFilter}
                  onChange={(e) => setFileTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все типы</option>
                  <option value="image">Изображения</option>
                  <option value="video">Видео</option>
                  <option value="application">Документы</option>
                </select>
              </div>
            </div>

            {/* Управление */}
            <div className="flex items-center space-x-3">
              {/* Режим просмотра */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon name="menu" size="sm" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon name="file" size="sm" />
                </button>
              </div>

              {/* Действия с выбранными */}
              {selectedFiles.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Badge color="blue">
                    {selectedFiles.length} выбрано
                  </Badge>
                  <Button
                    onClick={handleDeleteSelected}
                    variant="danger"
                    size="sm"
                  >
                    <Icon name="delete" size="sm" className="mr-1" />
                    Удалить
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Список файлов */}
        <Card className="p-6">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Icon name="folder" size="2xl" color="gray" className="mb-4" />
              <h3 className="text-lg font-medium mb-2">Файлы не найдены</h3>
              <p className="text-sm text-center max-w-md">
                {searchTerm || fileTypeFilter !== 'all' 
                  ? 'Попробуйте изменить фильтры поиска'
                  : 'Загрузите первые файлы в медиа-библиотеку'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Управление выбором */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedFiles.length === filteredFiles.length ? 'Отменить выбор всех' : 'Выбрать все'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {filteredFiles.length} файл(ов)
                  </span>
                </div>
              </div>

              {/* Сетка файлов */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredFiles.map((file) => (
                    <div key={file.id} className="relative group">
                      <div 
                        className={clsx(
                          'border-2 rounded-lg p-2 transition-all cursor-pointer',
                          selectedFiles.includes(file.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        onClick={() => handleFileSelect(file.id)}
                      >
                        <FileThumbnail
                          url={file.url}
                          fileName={file.name}
                          size="md"
                          showName={true}
                        />
                        
                                                 {/* Информация о файле */}
                         <div className="mt-2 text-xs text-gray-500">
                           <div className="flex items-center justify-between">
                             <Badge color="gray" className="text-xs">
                               {file.siteName}
                             </Badge>
                             <span>{formatFileSize(file.size)}</span>
                           </div>
                         </div>
                      </div>

                      {/* Чекбокс выбора */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleFileSelect(file.id)}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Список файлов */
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={clsx(
                        'flex items-center p-4 border rounded-lg transition-all cursor-pointer',
                        selectedFiles.includes(file.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => handleFileSelect(file.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelect(file.id)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 mr-4"
                      />
                      
                      <FileThumbnail
                        url={file.url}
                        fileName={file.name}
                        size="sm"
                        className="mr-4"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                                                 <div className="flex items-center space-x-4 mt-1">
                           <Badge color="gray" className="text-xs">
                             {file.siteName}
                           </Badge>
                           <span className="text-xs text-gray-500">
                             {formatFileSize(file.size)}
                           </span>
                           <span className="text-xs text-gray-500">
                             {new Date(file.createdAt).toLocaleDateString()}
                           </span>
                         </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon name="eye" size="sm" />
                        </a>
                        <a
                          href={file.url}
                          download
                          className="text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon name="download" size="sm" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MediaLibrary; 
import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useSitesStore } from '../store/sitesStore';
import { ImportService } from '../services/import.service';
import { ImportJob, ImportJobListItem } from '../types/import.types';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import { useToastStore } from '../store/toastStore';

const ImportExportPage: React.FC = () => {
  const { sites, fetchSites } = useSitesStore();
  const { success, error } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'import' | 'jobs'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<ImportJob | null>(null);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Состояние формы
  const [formData, setFormData] = useState({
    name: '',
    target_site: '',
    import_type: 'file',
    source_url: '',
    import_posts: true,
    import_pages: true,
    import_categories: true,
    import_tags: true,
    import_media: false,
    author_mapping: 'current_user',
  });

  // Автообновление задач
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Проверяем, есть ли выполняющиеся задачи
    const hasRunningJobs = jobs.some(job => job.status === 'running' || job.status === 'pending');
    
    if (hasRunningJobs) {
      // Обновляем каждые 5 секунд если есть активные задачи
      intervalId = setInterval(() => {
        fetchJobs();
      }, 5000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobs]); // Зависимость от jobs для пересоздания интервала

  useEffect(() => {
    fetchSites();
    if (activeTab === 'jobs') {
      fetchJobs();
    }
  }, [fetchSites, activeTab]);

  // Загрузка списка задач
  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const jobsList = await ImportService.getJobs();
      setJobs(jobsList as ImportJob[]);
    } catch (err) {
      console.error('Ошибка загрузки задач:', err);
      error('Ошибка загрузки списка задач');
    } finally {
      setJobsLoading(false);
    }
  };

  // Обработка drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Проверяем тип файла
    if (!file.name.toLowerCase().endsWith('.xml')) {
      error('Пожалуйста, выберите XML файл WordPress');
      return;
    }

    setSelectedFile(file);
    setPreviewData(null);
    success('Файл выбран успешно');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Предварительный просмотр файла
  const handlePreview = async () => {
    if (!selectedFile) {
      error('Сначала выберите файл');
      return;
    }

    setIsLoading(true);
    try {
      const preview = await ImportService.wordpressPreview(selectedFile);
      setPreviewData(preview);
      success('Предварительный просмотр загружен');
    } catch (err) {
      console.error('Ошибка предварительного просмотра:', err);
      error('Ошибка анализа файла');
    } finally {
      setIsLoading(false);
    }
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      error('Введите название импорта');
      return;
    }

    if (!formData.target_site) {
      error('Выберите сайт для импорта');
      return;
    }

    if (formData.import_type === 'file' && !selectedFile) {
      error('Выберите файл для импорта');
      return;
    }

    if (formData.import_type === 'url' && !formData.source_url) {
      error('Введите URL для импорта');
      return;
    }

    setIsLoading(true);
    try {
      const importData = {
        name: formData.name,
        target_site: parseInt(formData.target_site),
        config: {
          import_posts: formData.import_posts,
          import_pages: formData.import_pages,
          import_categories: formData.import_categories,
          import_tags: formData.import_tags,
          import_users: false,
          import_media: formData.import_media,
          update_existing: false,
          skip_duplicates: true,
          batch_size: 50,
        },
        file: selectedFile || undefined,
        api_url: formData.source_url || undefined,
      };

      const result = await ImportService.wordpressImport(importData);
      setImportResult(result);
      success('Импорт успешно запущен!');
      
      // Очищаем форму
      setFormData({
        name: '',
        target_site: '',
        import_type: 'file',
        source_url: '',
        import_posts: true,
        import_pages: true,
        import_categories: true,
        import_tags: true,
        import_media: false,
        author_mapping: 'current_user',
      });
      setSelectedFile(null);
      setPreviewData(null);
    } catch (err) {
      console.error('Ошибка импорта:', err);
      error('Ошибка запуска импорта');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'yellow' as const, label: 'Ожидание' },
      running: { color: 'blue' as const, label: 'Выполняется' },
      completed: { color: 'green' as const, label: 'Завершено' },
      failed: { color: 'red' as const, label: 'Ошибка' },
      cancelled: { color: 'gray' as const, label: 'Отменено' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  // Очистка импортированных данных
  const handleCleanup = async (jobId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить все импортированные данные? Это действие необратимо!')) {
      return;
    }

    try {
      const result = await ImportService.cleanupJob(jobId);
      success(`Данные очищены: удалено ${result.deleted.total} элементов (${result.deleted.posts} постов, ${result.deleted.pages} страниц)`);
      await fetchJobs(); // Обновляем список задач
    } catch (err) {
      console.error('Ошибка очистки данных:', err);
      error('Ошибка при очистке импортированных данных');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const siteOptions = sites.map(site => ({
    value: site.id.toString(),
    label: `${site.name} (${site.domain})`,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="upload" size="lg" color="primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Импорт и экспорт</h1>
              <p className="text-gray-600">Импортируйте посты, страницы и другой контент из WordPress</p>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name="upload" className="inline mr-2" />
              Новый импорт
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name="file" className="inline mr-2" />
              Задачи импорта
              {jobs.length > 0 && (
                <Badge color="gray" className="ml-2">
                  {jobs.length}
                </Badge>
              )}
            </button>
          </nav>
        </div>

        {/* Содержимое вкладок */}
        {activeTab === 'import' ? (
          <>
            {/* Результат импорта */}
            {importResult && (
              <Alert
                variant="success"
                onClose={() => setImportResult(null)}
              >
                <div>
                  <h4 className="font-medium">Импорт запущен успешно!</h4>
                  <p className="text-sm mt-1">
                    Задача "{importResult.name}" создана. Статус: {importResult.status}
                  </p>
                  {importResult.results && (
                    <div className="mt-2 text-sm">
                      <p>Обработано: {importResult.processed_items || 0} из {importResult.total_items || 0}</p>
                      <p>Импортировано: {importResult.imported_items || 0}</p>
                      {importResult.failed_items > 0 && (
                        <p className="text-red-600">Ошибки: {importResult.failed_items}</p>
                      )}
                    </div>
                  )}
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveTab('jobs')}
                    >
                      Перейти к задачам
                    </Button>
                  </div>
                </div>
              </Alert>
            )}

            {/* Форма импорта */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Левая колонка - Форма импорта */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    <Icon name="settings" className="inline mr-2" />
                    Настройки импорта
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Название импорта */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название импорта
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Например: Импорт блога от 21.06.2025"
                        required
                      />
                    </div>

                    {/* Выбор сайта */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Целевой сайт
                      </label>
                      <Select
                        value={formData.target_site}
                        onChange={(value) => setFormData({ ...formData, target_site: value })}
                        options={siteOptions}
                        placeholder="Выберите сайт для импорта"
                      />
                    </div>

                    {/* Тип импорта */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тип импорта
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="import_type"
                            value="file"
                            checked={formData.import_type === 'file'}
                            onChange={(e) => setFormData({ ...formData, import_type: e.target.value })}
                            className="mr-2"
                          />
                          <Icon name="file" className="mr-2" />
                          Загрузить XML файл
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="import_type"
                            value="url"
                            checked={formData.import_type === 'url'}
                            onChange={(e) => setFormData({ ...formData, import_type: e.target.value })}
                            className="mr-2"
                          />
                          <Icon name="link" className="mr-2" />
                          WordPress REST API
                        </label>
                      </div>
                    </div>

                    {/* URL для API импорта */}
                    {formData.import_type === 'url' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL WordPress сайта
                        </label>
                        <Input
                          type="url"
                          value={formData.source_url}
                          onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    )}

                    {/* Настройки контента */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Что импортировать?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.import_posts}
                            onChange={(e) => setFormData({ ...formData, import_posts: e.target.checked })}
                            className="mr-2"
                          />
                          <Icon name="edit" className="mr-2" />
                          Посты
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.import_pages}
                            onChange={(e) => setFormData({ ...formData, import_pages: e.target.checked })}
                            className="mr-2"
                          />
                          <Icon name="file" className="mr-2" />
                          Страницы
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.import_categories}
                            onChange={(e) => setFormData({ ...formData, import_categories: e.target.checked })}
                            className="mr-2"
                          />
                          <Icon name="folder" className="mr-2" />
                          Категории
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.import_tags}
                            onChange={(e) => setFormData({ ...formData, import_tags: e.target.checked })}
                            className="mr-2"
                          />
                          <Icon name="tag" className="mr-2" />
                          Теги
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.import_media}
                            onChange={(e) => setFormData({ ...formData, import_media: e.target.checked })}
                            className="mr-2"
                          />
                          <Icon name="image" className="mr-2" />
                          Медиафайлы
                        </label>
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex space-x-3 pt-4">
                      {formData.import_type === 'file' && selectedFile && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handlePreview}
                          disabled={isLoading}
                        >
                          <Icon name="eye" className="mr-2" />
                          Предпросмотр
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        loading={isLoading}
                      >
                        <Icon name="upload" className="mr-2" />
                        Запустить импорт
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>

              {/* Правая колонка - Загрузка файла / Предпросмотр */}
              <div className="space-y-6">
                {/* Загрузка файла */}
                {formData.import_type === 'file' && (
                  <Card>
                    <div className="p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">
                        <Icon name="file" className="inline mr-2" />
                        Загрузка файла
                      </h2>
                      
                      {/* Drag & Drop область */}
                      <div
                        className={`
                          border-2 border-dashed rounded-lg p-8 text-center transition-colors
                          ${dragActive 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <Icon 
                          name="upload" 
                          size="2xl" 
                          className={`mx-auto mb-4 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} 
                        />
                        
                        {selectedFile ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                              className="mt-2"
                            >
                              <Icon name="close" className="mr-1" />
                              Удалить
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Перетащите XML файл сюда или
                            </p>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Выберите файл
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              Поддерживаются только XML файлы WordPress
                            </p>
                          </div>
                        )}
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xml"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Предпросмотр данных */}
                {previewData && (
                  <Card>
                    <div className="p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">
                        <Icon name="eye" className="inline mr-2" />
                        Предпросмотр данных
                      </h2>
                      
                      {/* Информация о сайте */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900">{previewData.site_info.title}</h3>
                        <p className="text-sm text-gray-600">{previewData.site_info.description}</p>
                      </div>

                      {/* Статистика контента */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {previewData.content_counts.posts}
                          </div>
                          <div className="text-sm text-blue-600">Постов</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {previewData.content_counts.pages}
                          </div>
                          <div className="text-sm text-green-600">Страниц</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {previewData.content_counts.categories}
                          </div>
                          <div className="text-sm text-purple-600">Категорий</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {previewData.content_counts.tags}
                          </div>
                          <div className="text-sm text-orange-600">Тегов</div>
                        </div>
                      </div>

                      {/* Примеры постов */}
                      {previewData.sample_posts && previewData.sample_posts.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Примеры постов:</h4>
                          <div className="space-y-2">
                            {previewData.sample_posts.map((post: any, index: number) => (
                              <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                                <div className="font-medium">{post.title}</div>
                                <div className="text-gray-600">
                                  Автор: {post.author} • Дата: {post.date}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Список задач импорта */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Задачи импорта ({jobs.length})
              </h2>
              <div className="flex items-center space-x-3">
                {/* Индикатор автообновления */}
                {jobs.some(job => job.status === 'running' || job.status === 'pending') && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Автообновление активно
                  </div>
                )}
                
                <Button
                  variant="secondary"
                  onClick={fetchJobs}
                  disabled={jobsLoading}
                  loading={jobsLoading}
                >
                  <Icon name="refresh" className="mr-2" />
                  Обновить
                </Button>
              </div>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Загрузка задач...</p>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Icon name="upload" size="2xl" className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет задач импорта</h3>
                  <p className="text-gray-600 mb-4">
                    Создайте первую задачу импорта чтобы начать работу
                  </p>
                  <Button onClick={() => setActiveTab('import')}>
                    <Icon name="add" className="mr-2" />
                    Создать импорт
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {job.name}
                            </h3>
                            {getStatusBadge(job.status)}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <Icon name="globe" className="inline mr-1" />
                              Сайт: {sites.find(s => s.id === job.target_site)?.name || 'Неизвестно'}
                            </p>
                            <p>
                              <Icon name="calendar" className="inline mr-1" />
                              Создано: {formatDate(job.created_at)}
                            </p>
                            {job.started_at && (
                              <p>
                                <Icon name="play" className="inline mr-1" />
                                Запущено: {formatDate(job.started_at)}
                              </p>
                            )}
                            {job.completed_at && (
                              <p>
                                <Icon name="check" className="inline mr-1" />
                                Завершено: {formatDate(job.completed_at)}
                              </p>
                            )}
                          </div>

                          {/* Прогресс */}
                          {job.status === 'running' && job.total_items > 0 && (
                            <div className="mt-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Прогресс</span>
                                <span>{job.processed_items}/{job.total_items}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${((job.processed_items || 0) / job.total_items) * 100}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Статистика */}
                          {job.status === 'completed' && (
                            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center p-2 bg-green-50 rounded">
                                <div className="font-medium text-green-600">
                                  {job.imported_items || 0}
                                </div>
                                <div className="text-green-600">Импортировано</div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium text-blue-600">
                                  {job.processed_items || 0}
                                </div>
                                <div className="text-blue-600">Обработано</div>
                              </div>
                              <div className="text-center p-2 bg-red-50 rounded">
                                <div className="font-medium text-red-600">
                                  {job.failed_items || 0}
                                </div>
                                <div className="text-red-600">Ошибок</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Действия */}
                        <div className="flex space-x-2 ml-4">
                          {job.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await ImportService.startJob(job.id);
                                  success('Задача запущена');
                                  fetchJobs();
                                } catch (err) {
                                  error('Ошибка запуска задачи');
                                }
                              }}
                            >
                              <Icon name="play" className="mr-1" />
                              Запустить
                            </Button>
                          )}
                          
                          {job.status === 'running' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await ImportService.cancelJob(job.id);
                                  success('Задача отменена');
                                  fetchJobs();
                                } catch (err: any) {
                                  console.error('Ошибка отмены задачи:', err);
                                  
                                  // Проверяем, есть ли детальная информация об ошибке
                                  if (err.response?.data?.error) {
                                    const errorMessage = err.response.data.error;
                                    const status = err.response.data.status;
                                    
                                    if (status === 'completed') {
                                      error(`Задача уже завершена успешно (импортировано: ${err.response.data.imported_items || 0} элементов)`);
                                    } else if (status === 'failed') {
                                      error(`Задача уже завершена с ошибкой (ошибок: ${err.response.data.failed_items || 0})`);
                                    } else if (status === 'cancelled') {
                                      error('Задача уже была отменена ранее');
                                    } else {
                                      error(errorMessage);
                                    }
                                  } else {
                                    error('Ошибка отмены задачи');
                                  }
                                  
                                  // Обновляем список задач в любом случае
                                  fetchJobs();
                                }
                              }}
                            >
                              <Icon name="stop" className="mr-1" />
                              Отменить
                            </Button>
                          )}

                          {/* Кнопка отмены для задач в статусе pending */}
                          {job.status === 'pending' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await ImportService.cancelJob(job.id);
                                  success('Задача отменена (не была запущена)');
                                  fetchJobs();
                                } catch (err: any) {
                                  console.error('Ошибка отмены задачи:', err);
                                  
                                  if (err.response?.data?.error) {
                                    error(err.response.data.error);
                                  } else {
                                    error('Ошибка отмены задачи');
                                  }
                                  
                                  fetchJobs();
                                }
                              }}
                            >
                              <Icon name="stop" className="mr-1" />
                              Отменить
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              try {
                                const stats = await ImportService.getJobStats(job.id);
                                console.log('Статистика задачи:', stats);
                                // Здесь можно открыть модальное окно с детальной статистикой
                              } catch (err) {
                                error('Ошибка загрузки статистики');
                              }
                            }}
                          >
                            <Icon name="info" className="mr-1" />
                            Детали
                          </Button>

                          {/* Кнопка очистки для завершенных задач с импортированными данными */}
                          {job.status === 'completed' && job.imported_items > 0 && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCleanup(job.id)}
                            >
                              <Icon name="delete" className="mr-1" />
                              Очистить
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ImportExportPage; 
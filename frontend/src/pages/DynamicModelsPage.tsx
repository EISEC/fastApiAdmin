import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDynamicModelsStore } from '../store/dynamicModelsStore';
import { useSitesStore } from '../store/sitesStore';
import { useAuthStore } from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Button, Input, Select, Badge, Spinner, Modal } from '../components/ui';
import Card from '../components/ui/Card';
import Icon from '../components/ui/Icon';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DynamicModel } from '../types/dynamicModel.types';

/**
 * Страница управления динамическими моделями
 */
const DynamicModelsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const {
    models,
    modelsLoading,
    modelsError,
    modelsPagination,
    fetchModels,
    deleteModel,
    duplicateModel,
    exportModelConfig
  } = useDynamicModelsStore();

  const { sites, fetchSites } = useSitesStore();

  // Фильтры
  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState<number | ''>('');
  const [modelType, setModelType] = useState<'standalone' | 'extension' | ''>('');
  const [isActive, setIsActive] = useState<string>('');

  // Модалы
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<DynamicModel | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Применяем фильтры с задержкой
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, selectedSite, modelType, isActive]);

  const loadData = async () => {
    await Promise.all([
      fetchModels(),
      fetchSites()
    ]);
  };

  const applyFilters = () => {
    const filters: any = {};
    
    if (search) filters.search = search;
    if (selectedSite) filters.site = selectedSite;
    if (modelType) filters.model_type = modelType;
    if (isActive !== '') filters.is_active = isActive === 'true';

    fetchModels(filters);
  };

  const handleCreateModel = () => {
    navigate('/dynamic-models/create');
  };

  const handleEditModel = (model: DynamicModel) => {
    navigate(`/dynamic-models/${model.id}/edit`);
  };

  const handleViewData = (model: DynamicModel) => {
    navigate(`/dynamic-models/${model.id}/data`);
  };

  const handlePreviewModel = (model: DynamicModel) => {
    navigate(`/dynamic-models/${model.id}/preview`);
  };

  const handleDeleteClick = (model: DynamicModel) => {
    setModelToDelete(model);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!modelToDelete) return;

    const success = await deleteModel(modelToDelete.id);
    if (success) {
      setDeleteModalOpen(false);
      setModelToDelete(null);
    }
  };

  const handleDuplicate = async (model: DynamicModel) => {
    await duplicateModel(model.id);
  };

  const handleExport = async (model: DynamicModel) => {
    await exportModelConfig(model.id, false);
  };

  const getSiteName = (siteId: number) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || `Сайт ${siteId}`;
  };

  const getModelTypeLabel = (type: string) => {
    return type === 'standalone' ? 'Отдельная' : 'Расширение';
  };

  const getModelTypeColor = (type: string): 'blue' | 'purple' => {
    return type === 'standalone' ? 'blue' : 'purple';
  };

  // Опции для селектов
  const siteOptions = sites.map(site => ({
    value: site.id,
    label: site.name
  }));

  const modelTypeOptions = [
    { value: 'standalone', label: 'Отдельная модель' },
    { value: 'extension', label: 'Расширение' }
  ];

  const statusOptions = [
    { value: 'true', label: 'Активные' },
    { value: 'false', label: 'Неактивные' }
  ];

  if (modelsLoading && models.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Icon name="code" className="mr-3" />
              Динамические модели
            </h1>
            <p className="text-gray-600 mt-1">
              Создавайте и управляйте пользовательскими моделями данных
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dynamic-models/import')}
            >
              <Icon name="upload" size="sm" className="mr-2" />
              Импорт
            </Button>
            <Button onClick={handleCreateModel}>
              <Icon name="add" size="sm" className="mr-2" />
              Создать модель
            </Button>
          </div>
        </div>

        {/* Фильтры */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Icon name="search" size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Поиск по названию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={selectedSite}
              onChange={(value) => setSelectedSite(value ? Number(value) : '')}
              options={siteOptions}
              placeholder="Все сайты"
            />

            <Select
              value={modelType}
              onChange={(value) => setModelType(value as any)}
              options={modelTypeOptions}
              placeholder="Все типы"
            />

            <Select
              value={isActive}
              onChange={(value) => setIsActive(value)}
              options={statusOptions}
              placeholder="Все статусы"
            />
          </div>
        </Card>

        {/* Ошибка */}
        {modelsError && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <Icon name="alert" size="sm" />
              <span>{modelsError}</span>
            </div>
          </Card>
        )}

        {/* Список моделей */}
        <div className="space-y-4">
          {models.length === 0 && !modelsLoading ? (
            <Card className="p-8 text-center">
              <div className="space-y-3">
                <Icon name="database" size="xl" className="mx-auto text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">
                  Нет динамических моделей
                </h3>
                <p className="text-gray-600">
                  Создайте свою первую модель для начала работы
                </p>
                <Button onClick={handleCreateModel} className="mt-4">
                  Создать модель
                </Button>
              </div>
            </Card>
          ) : (
            models.map(model => (
              <Card key={model.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {model.name}
                      </h3>
                      <Badge color={getModelTypeColor(model.model_type)}>
                        {getModelTypeLabel(model.model_type)}
                      </Badge>
                      {!model.is_active && (
                        <Badge color="gray">
                          Неактивная
                        </Badge>
                      )}
                    </div>
                    
                    {model.description && (
                      <p className="text-gray-600 mb-3">
                        {model.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Icon name="globe" size="sm" />
                        <span>{getSiteName(model.site)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Icon name="menu" size="sm" />
                        <span>{model.fields_count || 0} полей</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Icon name="database" size="sm" />
                        <span>{model.data_entries_count || 0} записей</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Icon name="clock" size="sm" />
                        <span>
                          {formatDistanceToNow(new Date(model.created_at), {
                            addSuffix: true,
                            locale: ru
                          })}
                        </span>
                      </div>
                    </div>

                    {model.target_model && (
                      <div className="mt-2 text-sm text-purple-600">
                        <Icon name="link" size="sm" className="inline mr-1" />
                        Расширяет: {model.target_model}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewData(model)}
                      title="Данные"
                    >
                      <Icon name="database" size="sm" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewModel(model)}
                      title="Превью"
                    >
                      <Icon name="eye" size="sm" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditModel(model)}
                      title="Редактировать"
                    >
                      <Icon name="edit" size="sm" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(model)}
                      title="Дублировать"
                    >
                      <Icon name="copy" size="sm" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(model)}
                      title="Экспорт"
                    >
                      <Icon name="download" size="sm" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(model)}
                      title="Удалить"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Icon name="delete" size="sm" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Пагинация */}
        {modelsPagination.count > models.length && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Показано {models.length} из {modelsPagination.count}
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!modelsPagination.previous}
                  onClick={() => {/* TODO: Implement pagination */}}
                >
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!modelsPagination.next}
                  onClick={() => {/* TODO: Implement pagination */}}
                >
                  Далее
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Модал удаления */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Удалить модель"
        >
          <div className="space-y-4">
            <p>
              Вы уверены, что хотите удалить модель{' '}
              <strong>{modelToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-red-600">
              Все данные этой модели будут удалены без возможности восстановления.
            </p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
              >
                Удалить
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default DynamicModelsPage; 
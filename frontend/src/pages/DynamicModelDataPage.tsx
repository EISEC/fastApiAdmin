import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDynamicModelsStore } from '../store/dynamicModelsStore';
import { useSitesStore } from '../store/sitesStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Button, Input, Select, Badge, Spinner, Modal, Table } from '../components/ui';
import Card from '../components/ui/Card';
import Icon from '../components/ui/Icon';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DynamicModel, DynamicModelData, DynamicModelDataFilters } from '../types/dynamicModel.types';
import type { TableColumn } from '../components/ui/Table';

/**
 * Страница управления данными динамической модели
 */
const DynamicModelDataPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    selectedModel,
    modelData,
    dataLoading,
    dataError,
    dataPagination,
    fetchModel,
    fetchModelData,
    deleteModelData
  } = useDynamicModelsStore();

  const { sites } = useSitesStore();

  // Фильтры
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');

  // Модалы
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dataToDelete, setDataToDelete] = useState<DynamicModelData | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    if (selectedModel) {
      applyFilters();
    }
  }, [search, publishedFilter, selectedModel]);

  const loadData = async () => {
    if (!id) return;
    
    await fetchModel(parseInt(id));
  };

  const applyFilters = () => {
    if (!selectedModel) return;

    const filters: DynamicModelDataFilters = {
      dynamic_model: selectedModel.id,
    };
    
    if (search) filters.search = search;
    if (publishedFilter !== '') filters.is_published = publishedFilter === 'true';

    fetchModelData(filters);
  };

  const handleCreateData = () => {
    navigate(`/dynamic-models/${id}/data/create`);
  };

  const handleEditData = (data: DynamicModelData) => {
    navigate(`/dynamic-models/${id}/data/${data.id}/edit`);
  };

  const handleDeleteClick = (data: DynamicModelData) => {
    setDataToDelete(data);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dataToDelete) return;

    const success = await deleteModelData(dataToDelete.id);
    if (success) {
      setDeleteModalOpen(false);
      setDataToDelete(null);
    }
  };

  const handleBackToModels = () => {
    navigate('/dynamic-models');
  };

  const getTableColumns = (): TableColumn<DynamicModelData>[] => {
    if (!selectedModel?.fields_config?.fields) return [];

    const baseColumns: TableColumn<DynamicModelData>[] = [
      {
        key: 'display_value',
        label: 'Значение',
        render: (value, record) => (
          <span className="font-medium text-gray-900">
            {record.display_value || `Запись #${record.id}`}
          </span>
        )
      }
    ];

    // Добавляем колонки для полей, которые помечены как show_in_list
    const fieldColumns = selectedModel.fields_config.fields
      .filter(field => field.show_in_list)
      .map(field => ({
        key: `data.${field.name}` as keyof DynamicModelData,
        label: field.label,
        render: (value: any, record: DynamicModelData) => {
          const fieldValue = record.data[field.name];
          
          if (fieldValue === null || fieldValue === undefined) {
            return <span className="text-gray-400">—</span>;
          }

          // Простая обработка разных типов полей
          if (field.type === 'boolean') {
            return fieldValue ? 
              <Badge color="green">Да</Badge> : 
              <Badge color="gray">Нет</Badge>;
          }

          if (field.type === 'date' || field.type === 'datetime') {
            return new Date(fieldValue).toLocaleDateString();
          }

          if (typeof fieldValue === 'object') {
            return <span className="text-xs text-gray-500">Объект</span>;
          }

          return String(fieldValue);
        }
      }));

    const statusColumns: TableColumn<DynamicModelData>[] = [
      {
        key: 'is_published',
        label: 'Статус',
        render: (value) => (
          <Badge color={value ? 'green' : 'gray'}>
            {value ? 'Опубликовано' : 'Черновик'}
          </Badge>
        )
      },
      {
        key: 'created_at',
        label: 'Создано',
        render: (value) => (
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(value as string), {
              addSuffix: true,
              locale: ru
            })}
          </span>
        )
      },
      {
        key: 'actions',
        label: 'Действия',
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditData(record)}
              title="Редактировать"
            >
              <Icon name="edit" size="sm" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteClick(record)}
              title="Удалить"
              className="text-red-500 hover:text-red-700"
            >
              <Icon name="delete" size="sm" />
            </Button>
          </div>
        )
      }
    ];

    return [...baseColumns, ...fieldColumns, ...statusColumns];
  };

  if (!id) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-gray-900">
            ID модели не указан
          </h1>
        </div>
      </DashboardLayout>
    );
  }

  if (dataLoading && !selectedModel) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedModel) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Модель не найдена
          </h1>
          <Button onClick={handleBackToModels}>
            Вернуться к моделям
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const publishedOptions = [
    { value: 'true', label: 'Опубликованные' },
    { value: 'false', label: 'Черновики' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToModels}
              >
                <Icon name="arrowLeft" size="sm" className="mr-2" />
                Назад
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Icon name="database" className="mr-3" />
                  {selectedModel.display_name || selectedModel.name}
                </h1>
                {(() => {
                  const site = sites.find(s => s.id === selectedModel.site);
                  return site ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Icon name="globe" size="sm" className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Сайт: <span className="font-medium">{site.name}</span>
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            <p className="text-gray-600">
              Управление записями данных для модели
            </p>
          </div>
          
          <Button onClick={handleCreateData}>
            <Icon name="add" size="sm" className="mr-2" />
            Добавить запись
          </Button>
        </div>

        {/* Информация о модели */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-gray-500">Тип:</span>
                <Badge color={selectedModel.model_type === 'standalone' ? 'blue' : 'purple'} className="ml-2">
                  {selectedModel.model_type === 'standalone' ? 'Отдельная' : 'Расширение'}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Полей:</span>
                <span className="ml-2 font-medium">{selectedModel.fields_count || 0}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Записей:</span>
                <span className="ml-2 font-medium">{dataPagination.count}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Фильтры */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Icon name="search" size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Поиск по записям..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={publishedFilter}
              onChange={(value) => setPublishedFilter(value)}
              options={publishedOptions}
              placeholder="Все записи"
            />
          </div>
        </Card>

        {/* Ошибка */}
        {dataError && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <Icon name="alert" size="sm" />
              <span>{dataError}</span>
            </div>
          </Card>
        )}

        {/* Таблица данных */}
        <Card className="p-6">
          {dataLoading ? (
            <div className="flex items-center justify-center h-32">
              <Spinner size="lg" />
            </div>
          ) : modelData.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="database" size="xl" className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет записей
              </h3>
              <p className="text-gray-600 mb-4">
                Создайте первую запись для этой модели
              </p>
              <Button onClick={handleCreateData}>
                Добавить запись
              </Button>
            </div>
          ) : (
            <Table
              data={modelData}
              columns={getTableColumns()}
            />
          )}
        </Card>

        {/* Модал удаления */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Удалить запись"
        >
          <div className="space-y-4">
            <p>
              Вы уверены, что хотите удалить запись{' '}
              <strong>{dataToDelete?.display_value || `#${dataToDelete?.id}`}</strong>?
            </p>
            <p className="text-sm text-red-600">
              Это действие нельзя будет отменить.
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

export default DynamicModelDataPage; 
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useDynamicModelsStore, useToastStore } from '../store';
import type { DynamicModel, DynamicModelField } from '../types/dynamicModel.types';
import DashboardLayout from '../components/layout/DashboardLayout';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Table from '../components/ui/Table';
import DynamicModelBuilder from '../components/dynamic/DynamicModelBuilder';
import { convertFieldsToSchema, convertFieldsFromSchema } from '../utils/typeConverters';

/**
 * Страница управления динамическими моделями
 */
const DynamicModels: React.FC = () => {
  const {
    models,
    isLoading,
    error,
    fetchModels,
    createModel,
    updateModel,
    deleteModel,
    toggleStatus,
    clearError
  } = useDynamicModelsStore();
  
  const addToast = useToastStore(state => state.addToast);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<DynamicModel | null>(null);
  const [newModel, setNewModel] = useState({
    name: '',
    display_name: '',
    description: '',
    fields: [] as DynamicModelField[]
  });

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Показываем тост при ошибках
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: error });
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleCreateModel = async () => {
    if (!newModel.name || !newModel.display_name) {
      addToast({ type: 'error', title: 'Заполните название модели' });
      return;
    }

    if (newModel.fields.length === 0) {
      addToast({ type: 'error', title: 'Добавьте хотя бы одно поле' });
      return;
    }

    try {
      await createModel({
        name: newModel.name,
        display_name: newModel.display_name,
        site: 1, // TODO: получить из контекста
        model_type: 'standalone',
        description: newModel.description,
        fields_config: {
          fields: newModel.fields.map(field => ({
            name: field.name,
            type: field.type as string,
            label: field.label,
            required: field.required,
            default_value: field.default_value,
            help_text: field.help_text,
            placeholder: field.placeholder,
            options: field.options,
            validation: field.validation,
            ui_config: field.ui_config,
            show_in_list: field.show_in_list,
            order: field.order,
          }))
        }
      });
      
      setIsCreateModalOpen(false);
      setNewModel({ name: '', display_name: '', description: '', fields: [] });
      addToast({ type: 'success', title: 'Модель создана успешно' });
    } catch (error) {
      // Ошибка уже обработана в store
    }
  };

  const handleEditModel = (model: DynamicModel) => {
    setEditingModel(model);
    setNewModel({
      name: model.name,
      display_name: model.display_name || '',
      description: model.description || '',
      fields: (model.fields_config?.fields || []).map((field, index) => ({
        ...field,
        id: `field_${index}` // Добавляем id для FieldSchema
      }))
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateModel = async () => {
    if (!editingModel || !newModel.display_name) {
      addToast({ type: 'error', title: 'Заполните название модели' });
      return;
    }

    try {
      await updateModel(editingModel.id, {
        display_name: newModel.display_name,
        description: newModel.description,
        fields_config: {
          fields: newModel.fields
        }
      });
      
      setIsEditModalOpen(false);
      setEditingModel(null);
      setNewModel({ name: '', display_name: '', description: '', fields: [] });
      addToast({ type: 'success', title: 'Модель обновлена' });
    } catch (error) {
      // Ошибка уже обработана в store
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту модель? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await deleteModel(modelId);
      addToast({ type: 'success', title: 'Модель удалена' });
    } catch (error) {
      // Ошибка уже обработана в store
    }
  };

  const handleToggleStatus = async (modelId: number) => {
    try {
      await toggleStatus(modelId);
      addToast({ type: 'success', title: 'Статус модели изменен' });
    } catch (error) {
      // Ошибка уже обработана в store
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewModel({ name: '', display_name: '', description: '', fields: [] });
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingModel(null);
    setNewModel({ name: '', display_name: '', description: '', fields: [] });
  };

  const columns = [
    {
      key: 'display_name',
      label: 'Название',
      render: (_value: unknown, model: DynamicModel) => (
        <div>
          <div className="font-medium text-gray-900">
            {model.display_name}
          </div>
          <div className="text-sm text-gray-500">
            {model.name} ({model.table_name})
          </div>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Описание',
      render: (_value: unknown, model: DynamicModel) => (
        <div className="text-sm text-gray-600">
          {model.description || 'Без описания'}
        </div>
      )
    },
    {
      key: 'fields_count',
      label: 'Полей',
      render: (_value: unknown, model: DynamicModel) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {model.fields_config?.fields?.length || 0}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Статус',
      render: (_value: unknown, model: DynamicModel) => (
        <span className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          model.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        )}>
          {model.is_active ? 'Активная' : 'Неактивная'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Создана',
      render: (_value: unknown, model: DynamicModel) => (
        <span className="text-sm text-gray-500">
          {new Date(model.created_at).toLocaleDateString('ru-RU')}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Действия',
      render: (_value: unknown, model: DynamicModel) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEditModel(model)}
          >
            <Icon name="edit" size="xs" />
          </Button>
          <Button
            variant={model.is_active ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => handleToggleStatus(model.id)}
          >
            <Icon name={model.is_active ? 'check' : 'close'} size="xs" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteModel(model.id)}
          >
            <Icon name="delete" size="xs" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Динамические модели
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Создавайте и управляйте пользовательскими моделями данных. Всего моделей: {models.length}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Icon name="add" size="xs" className="mr-1" />
              Создать модель
            </Button>
          </div>
        </div>

        {/* Models Table */}
        <Card>
          <Table
            data={models}
            columns={columns}
            loading={isLoading}
            emptyMessage="Нет созданных моделей"
          />
        </Card>

        {/* Create Model Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          title="Создать новую модель"
          size="xl"
        >
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Техническое название *
                  </label>
                  <Input
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    placeholder="product"
                    pattern="[a-z_][a-z0-9_]*"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Только латинские буквы, цифры и подчеркивания
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Отображаемое название *
                  </label>
                  <Input
                    value={newModel.display_name}
                    onChange={(e) => setNewModel({ ...newModel, display_name: e.target.value })}
                    placeholder="Товары"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <Textarea
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  placeholder="Описание модели..."
                  rows={2}
                />
              </div>

              <DynamicModelBuilder
                fields={convertFieldsToSchema(newModel.fields)}
                onChange={(fields) => setNewModel({ ...newModel, fields: convertFieldsFromSchema(fields) })}
              />

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="primary"
                  onClick={handleCreateModel}
                  className="flex-1"
                >
                  Создать модель
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCloseCreateModal}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Edit Model Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          title="Редактировать модель"
          size="xl"
        >
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Техническое название *
                  </label>
                  <Input
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    placeholder="product"
                    pattern="[a-z_][a-z0-9_]*"
                    disabled // Обычно техническое название нельзя менять после создания
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Отображаемое название *
                  </label>
                  <Input
                    value={newModel.display_name}
                    onChange={(e) => setNewModel({ ...newModel, display_name: e.target.value })}
                    placeholder="Товары"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <Textarea
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  placeholder="Описание модели..."
                  rows={2}
                />
              </div>

              <DynamicModelBuilder
                fields={convertFieldsToSchema(newModel.fields)}
                onChange={(fields) => setNewModel({ ...newModel, fields: convertFieldsFromSchema(fields) })}
              />

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="primary"
                  onClick={handleUpdateModel}
                  className="flex-1"
                >
                  Сохранить изменения
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCloseEditModal}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default DynamicModels; 
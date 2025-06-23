import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Button, Switch, Spinner } from '../components/ui';
import Card from '../components/ui/Card';
import Icon from '../components/ui/Icon';
import DynamicFieldRenderer from '../components/forms/DynamicFieldRenderer';
import { useDynamicModelsStore } from '../store/dynamicModelsStore';
import type { DynamicModel, DynamicModelData, DynamicModelDataUpdateData } from '../types/dynamicModel.types';

/**
 * Страница редактирования записи данных для динамической модели
 */
const EditDynamicModelDataPage: React.FC = () => {
  const { id, dataId } = useParams<{ id: string; dataId: string }>();
  const navigate = useNavigate();
  
  console.log('🔴 EditDynamicModelDataPage loaded, URL id:', id, 'dataId:', dataId);
  
  const {
    selectedModel,
    selectedModelData,
    fetchModel,
    fetchModelDataEntry,
    updateModelData
  } = useDynamicModelsStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id && dataId) {
      loadData();
    }
  }, [id, dataId]);

  const loadData = async () => {
    if (!id || !dataId) return;
    
    try {
      setLoading(true);
      await Promise.all([
        fetchModel(parseInt(id)),
        fetchModelDataEntry(parseInt(dataId))
      ]);
    } finally {
      setLoading(false);
    }
  };



  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    mode: 'onChange'
  });

  // Заполняем форму данными при загрузке
  useEffect(() => {
    if (selectedModel && selectedModelData) {
      const formData = {
        is_published: selectedModelData.is_published,
        ...selectedModelData.data
      };
      reset(formData);
    }
  }, [selectedModel, selectedModelData, reset]);

  const handleFormSubmit = async (data: any) => {
    if (!selectedModelData) return;
    
    setSubmitting(true);
    try {
      const updateData: DynamicModelDataUpdateData = {
        data,
        is_published: data.is_published || false,
      };

      const result = await updateModelData(selectedModelData.id, updateData);
      if (result) {
        navigate(`/dynamic-models/${id}/data`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/dynamic-models/${id}/data`);
  };

  const getErrorMessage = (error: any) => {
    if (error && typeof error === 'object' && 'message' in error) {
      return error.message;
    }
    return 'Ошибка валидации';
  };

  const renderField = (field: any) => {
    const fieldError = errors[field.name] as any;
    
    return (
      <DynamicFieldRenderer
        key={field.name}
        field={field}
        register={register}
        control={control}
        error={fieldError}
      />
    );
  };

  if (!id || !dataId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-gray-900">
            Неверные параметры
          </h1>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedModel || !selectedModelData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Данные не найдены
          </h1>
          <Button onClick={handleCancel}>
            Вернуться к записям
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            <Icon name="arrowLeft" size="sm" className="mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Icon name="edit" className="mr-3" />
              Редактирование записи
            </h1>
            <p className="text-gray-600 mt-1">
              Модель: {selectedModel.name} • ID: {selectedModelData.id}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Поля данных */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Icon name="edit" className="mr-2" />
              Данные записи
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedModel.fields_config.fields.map(renderField)}
            </div>
          </Card>

          {/* Настройки публикации */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Icon name="settings" className="mr-2" />
              Настройки публикации
            </h3>
            
            <Controller
              name="is_published"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value || false}
                  onChange={field.onChange}
                  label="Опубликовать запись"
                  description="Определяет, будет ли запись видна публично"
                />
              )}
            />
          </Card>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
                              disabled={submitting}
              loading={submitting}
            >
              Сохранить изменения
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditDynamicModelDataPage; 
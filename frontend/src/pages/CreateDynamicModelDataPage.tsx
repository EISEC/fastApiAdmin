import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Button, Switch, Spinner } from '../components/ui';
import Card from '../components/ui/Card';
import Icon from '../components/ui/Icon';
import DynamicFieldRenderer from '../components/forms/DynamicFieldRenderer';
import { useDynamicModelsStore } from '../store/dynamicModelsStore';
import type { DynamicModel, DynamicModelDataCreateData } from '../types/dynamicModel.types';

/**
 * Страница создания записи данных для динамической модели
 */
const CreateDynamicModelDataPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  console.log('🟢 CreateDynamicModelDataPage loaded, URL id:', id);
  
  const {
    selectedModel,
    fetchModel,
    createModelData
  } = useDynamicModelsStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  


  useEffect(() => {
    if (id) {
      loadModel();
    }
  }, [id]);

  const loadModel = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await fetchModel(parseInt(id));
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
    mode: 'onChange',
    defaultValues: {
      is_published: false
    }
  });

  // Обновляем значения формы после загрузки модели
  useEffect(() => {
    if (selectedModel) {
      const defaultValues = {
        is_published: false,
        ...selectedModel.fields_config.fields.reduce((acc, field) => {
          // Устанавливаем правильные значения по умолчанию в зависимости от типа поля
          if (['multiselect', 'checkbox'].includes(field.type)) {
            acc[field.name] = field.default_value || [];
          } else if (field.type === 'boolean') {
            acc[field.name] = field.default_value || false;
          } else if (['number', 'decimal', 'range', 'rating'].includes(field.type)) {
            acc[field.name] = field.default_value || 0;
          } else if (['file', 'image', 'gallery'].includes(field.type)) {
            acc[field.name] = null; // Для файлов изначально null
          } else {
            acc[field.name] = field.default_value || '';
          }
          return acc;
        }, {} as Record<string, any>)
      };
      

      reset(defaultValues);
    }
  }, [selectedModel, reset]);



  const handleFormSubmit = async (data: any) => {
    if (!selectedModel) return;
    
    console.log('Form data before processing:', data);
    console.log('Form data types:', Object.keys(data).map(key => `${key}: ${typeof data[key]} ${data[key] instanceof File ? '(File)' : ''}`));
    
    setSubmitting(true);
    try {
      // Обрабатываем данные перед отправкой
      const processedData = { ...data };
      delete processedData.is_published; // Убираем is_published из data
      
      console.log('Processed data:', processedData);
      console.log('Processed data types:', Object.keys(processedData).map(key => `${key}: ${typeof processedData[key]} ${processedData[key] instanceof File ? '(File)' : ''}`));
      
      const createData: DynamicModelDataCreateData = {
        dynamic_model: selectedModel.id,
        data: processedData,
        is_published: data.is_published || false,
      };

      console.log('Final create data:', createData);

      const result = await createModelData(createData);
      if (result) {
        navigate(`/dynamic-models/${selectedModel.id}/data`);
      }
    } catch (error) {
      console.error('Error creating model data:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (selectedModel) {
      navigate(`/dynamic-models/${selectedModel.id}/data`);
    } else {
      navigate('/dynamic-models');
    }
  };

  const renderField = (field: any) => {
    const fieldError = (errors as any)?.[field.name];
    
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

  if (loading) {
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
          <Button onClick={handleCancel}>
            Вернуться к моделям
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
              <Icon name="add" className="mr-3" />
              Создание записи
            </h1>
            <p className="text-gray-600 mt-1">
              Модель: {selectedModel.name}
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
              Создать запись
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateDynamicModelDataPage; 
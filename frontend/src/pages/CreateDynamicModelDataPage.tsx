import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

  // Динамически создаем схему валидации на основе полей модели
  const createValidationSchema = (model: DynamicModel) => {
    const schemaFields: Record<string, any> = {};
    
    model.fields_config.fields.forEach(field => {
      let fieldSchema: any;
      
      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Некорректный email');
          break;
        case 'url':
          fieldSchema = z.string().url('Некорректный URL');
          break;
        case 'number':
        case 'decimal':
        case 'range':
          fieldSchema = z.number().or(z.string().transform(val => parseInt(val, 10)));
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'date':
        case 'datetime':
        case 'time':
          fieldSchema = z.string();
          break;
        case 'file':
        case 'image':
        case 'gallery':
          fieldSchema = z.any(); // Файлы могут быть File объектами или строками
          break;
        case 'multiselect':
        case 'checkbox':
          fieldSchema = z.array(z.string());
          break;
        case 'json':
          fieldSchema = z.string().refine((val) => {
            try {
              JSON.parse(val);
              return true;
            } catch {
              return false;
            }
          }, { message: 'Должен быть валидный JSON' });
          break;
        case 'color':
          fieldSchema = z.string().regex(/^#[0-9A-F]{6}$/i, 'Некорректный цвет');
          break;
        case 'rating':
          fieldSchema = z.number().min(0).max(5);
          break;
        default:
          fieldSchema = z.string();
      }
      
      if (field.required) {
        fieldSchema = fieldSchema.min(1, 'Поле обязательно');
      } else {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaFields[field.name] = fieldSchema;
    });

    // Добавляем системные поля
    schemaFields.is_published = z.boolean().optional();
    
    return z.object(schemaFields);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid }
  } = useForm({
    resolver: selectedModel ? zodResolver(createValidationSchema(selectedModel)) : undefined,
    mode: 'onChange',
    defaultValues: {
      is_published: false,
      ...selectedModel?.fields_config.fields.reduce((acc, field) => {
        acc[field.name] = field.default_value || '';
        return acc;
      }, {} as Record<string, any>)
    }
  });

  const handleFormSubmit = async (data: any) => {
    if (!selectedModel) return;
    
    setSubmitting(true);
    try {
      const createData: DynamicModelDataCreateData = {
        dynamic_model: selectedModel.id,
        data,
        is_published: data.is_published || false,
      };

      const result = await createModelData(createData);
      if (result) {
        navigate(`/dynamic-models/${selectedModel.id}/data`);
      }
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
              disabled={!isValid || submitting}
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
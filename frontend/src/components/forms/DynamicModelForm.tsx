import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Textarea, Select, Modal } from '../ui';
import Icon from '../ui/Icon';
import Card from '../ui/Card';
import { useDynamicModelsStore } from '../../store/dynamicModelsStore';
import { useSitesStore } from '../../store/sitesStore';
import type { 
  DynamicModel, 
  DynamicModelCreateData, 
  DynamicModelUpdateData
} from '../../types/dynamicModel.types';

// Zod схемы для валидации
const fieldValidationSchema = z.object({
  min_length: z.number().optional(),
  max_length: z.number().optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  pattern: z.string().optional(),
  required: z.boolean().optional(),
  type: z.string().optional(),
});

const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const dynamicModelFieldSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Только латиница, цифры и _'),
  type: z.string().min(1, 'Выберите тип'),
  label: z.string().min(1, 'Обязательное поле'),
  required: z.boolean(),
  default_value: z.any().optional(),
  help_text: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(fieldOptionSchema).optional(),
  validation: fieldValidationSchema.optional(),
  ui_config: z.record(z.any()).optional(),
  show_in_list: z.boolean().optional(),
  order: z.number().optional(),
});

const dynamicModelSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  site: z.number({ required_error: 'Выберите сайт', invalid_type_error: 'Выберите сайт' }).min(1, 'Выберите сайт'),
  description: z.string().optional(),
  model_type: z.enum(['standalone', 'extension']),
  target_model: z.string().optional(),
  fields_config: z.object({
    fields: z.array(dynamicModelFieldSchema).min(1, 'Добавьте хотя бы одно поле'),
  }),
  validation_rules: z.record(z.any()).optional(),
});

type DynamicModelFormData = z.infer<typeof dynamicModelSchema>;

interface DynamicModelFormProps {
  model?: DynamicModel;
  onSubmit: (data: DynamicModelCreateData | DynamicModelUpdateData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Форма создания/редактирования динамической модели
 */
const DynamicModelForm: React.FC<DynamicModelFormProps> = ({
  model,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { fieldTypes, fetchFieldTypes } = useDynamicModelsStore();
  const { sites, fetchSites } = useSitesStore();
  
  const [fieldOptionsModal, setFieldOptionsModal] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number | null>(null);
  const [availableTargetModels] = useState<Array<{ model: string; label: string }>>([
    { model: 'posts.Post', label: 'Посты' },
    { model: 'pages.Page', label: 'Страницы' },
    { model: 'accounts.CustomUser', label: 'Пользователи' },
    { model: 'sites.Site', label: 'Сайты' },
  ]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<DynamicModelFormData>({
    resolver: zodResolver(dynamicModelSchema),
    mode: 'onChange',
    defaultValues: model ? {
      name: model.name,
      site: model.site,
      description: model.description || '',
      model_type: model.model_type,
      target_model: model.target_model || '',
      fields_config: model.fields_config,
      validation_rules: model.validation_rules || {},
    } : {
      name: '',
      site: undefined as any,
      description: '',
      model_type: 'standalone',
      target_model: '',
      fields_config: {
        fields: []
      },
      validation_rules: {},
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields_config.fields'
  });

  const watchedModelType = watch('model_type');

  useEffect(() => {
    fetchFieldTypes();
    fetchSites();
  }, []);

  const handleFormSubmit = async (data: DynamicModelFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const addField = () => {
    append({
      name: '',
      type: 'text',
      label: '',
      required: false,
      order: fields.length,
    });
  };

  const duplicateField = (index: number) => {
    const field = fields[index];
    append({
      ...field,
      name: `${field.name}_copy`,
      label: `${field.label} (копия)`,
      order: fields.length,
    });
  };

  const moveFieldUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const moveFieldDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  const openFieldOptions = (index: number) => {
    setCurrentFieldIndex(index);
    setFieldOptionsModal(true);
  };

  const getFieldTypeOptions = () => {
    return fieldTypes.map(type => ({
      value: type.name,
      label: type.label
    }));
  };

  const getSiteOptions = () => {
    return sites.map(site => ({
      value: site.id,
      label: site.name
    }));
  };

  const getTargetModelOptions = () => {
    return availableTargetModels.map(model => ({
      value: model.model,
      label: model.label
    }));
  };

  const needsTargetModel = watchedModelType === 'extension';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Основная информация */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Icon name="file" className="mr-2" />
          Основная информация
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название модели *
            </label>
            <Input
              {...register('name')}
              placeholder="Например: Отзывы клиентов"
              error={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сайт *
            </label>
            <Controller
              name="site"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onChange={(value) => {
                    const numValue = value ? Number(value) : undefined;
                    field.onChange(numValue);
                  }}
                  options={getSiteOptions()}
                  placeholder="Выберите сайт"
                  error={!!errors.site}
                />
              )}
            />
            {errors.site && (
              <p className="mt-1 text-sm text-red-600">{errors.site.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <Textarea
              {...register('description')}
              placeholder="Краткое описание назначения модели"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип модели *
            </label>
            <Controller
              name="model_type"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'standalone', label: 'Отдельная модель' },
                    { value: 'extension', label: 'Расширение существующей модели' }
                  ]}
                  error={!!errors.model_type}
                />
              )}
            />
            {errors.model_type && (
              <p className="mt-1 text-sm text-red-600">{errors.model_type.message}</p>
            )}
          </div>

          {needsTargetModel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Целевая модель *
              </label>
              <Controller
                name="target_model"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={getTargetModelOptions()}
                    placeholder="Выберите модель для расширения"
                    error={!!errors.target_model}
                  />
                )}
              />
              {errors.target_model && (
                <p className="mt-1 text-sm text-red-600">{errors.target_model.message}</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Поля модели */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Icon name="code" className="mr-2" />
            Поля модели
          </h3>
          <Button
            type="button"
            onClick={addField}
            size="sm"
          >
            <Icon name="add" size="sm" className="mr-2" />
            Добавить поле
          </Button>
        </div>

        {errors.fields_config?.fields && typeof errors.fields_config.fields === 'object' && 'message' in errors.fields_config.fields && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errors.fields_config.fields.message}
          </div>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    Поле #{index + 1}
                  </span>
                  {field.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveFieldUp(index)}
                    disabled={index === 0}
                    title="Переместить вверх"
                  >
                    <Icon name="arrowUp" size="sm" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveFieldDown(index)}
                    disabled={index === fields.length - 1}
                    title="Переместить вниз"
                  >
                    <Icon name="arrowDown" size="sm" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateField(index)}
                    title="Дублировать"
                  >
                    <Icon name="copy" size="sm" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openFieldOptions(index)}
                    title="Настройки"
                  >
                    <Icon name="settings" size="sm" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    title="Удалить"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Icon name="delete" size="sm" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Название поля *
                  </label>
                  <Input
                    {...register(`fields_config.fields.${index}.name`)}
                    placeholder="field_name"
                    error={!!errors.fields_config?.fields?.[index]?.name}
                  />
                  {errors.fields_config?.fields?.[index]?.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.fields_config.fields[index]?.name?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Тип поля *
                  </label>
                  <Controller
                    name={`fields_config.fields.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={field.onChange}
                        options={getFieldTypeOptions()}
                        placeholder="Выберите тип"
                        error={!!errors.fields_config?.fields?.[index]?.type}
                      />
                    )}
                  />
                  {errors.fields_config?.fields?.[index]?.type && (
                    <p className="mt-1 text-xs text-red-600">
                      {typeof errors.fields_config.fields[index]?.type === 'object' && 
                       errors.fields_config.fields[index]?.type?.message || 'Поле обязательно'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Отображаемое название *
                  </label>
                  <Input
                    {...register(`fields_config.fields.${index}.label`)}
                    placeholder="Название поля"
                    error={!!errors.fields_config?.fields?.[index]?.label}
                  />
                  {errors.fields_config?.fields?.[index]?.label && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.fields_config.fields[index]?.label?.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Подсказка
                  </label>
                  <Input
                    {...register(`fields_config.fields.${index}.help_text`)}
                    placeholder="Дополнительная информация о поле"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register(`fields_config.fields.${index}.required`, {
                        setValueAs: (value) => Boolean(value)
                      })}
                      className="rounded border-gray-300"
                    />
                    Обязательное
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register(`fields_config.fields.${index}.show_in_list`, {
                        setValueAs: (value) => Boolean(value)
                      })}
                      className="rounded border-gray-300"
                    />
                    В списке
                  </label>
                </div>
              </div>
            </Card>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8">
              <Icon name="add" size="xl" className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">
                Добавьте поля для вашей модели
              </p>
              <Button type="button" onClick={addField}>
                Добавить первое поле
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Кнопки действий */}
      <div className="flex justify-end gap-3">
        {/* Отладочная информация - временно */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mr-auto">
            <div>isValid: {isValid.toString()}</div>
            <div>errors: {Object.keys(errors).length > 0 ? JSON.stringify(errors, null, 2) : 'none'}</div>
          </div>
        )}
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={!isValid || loading}
          loading={loading}
        >
          {model ? 'Обновить модель' : 'Создать модель'}
        </Button>
      </div>

      {/* Модал настроек поля */}
      <Modal
        isOpen={fieldOptionsModal}
        onClose={() => setFieldOptionsModal(false)}
        title="Настройки поля"
        size="lg"
      >
        {currentFieldIndex !== null && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Значение по умолчанию
              </label>
              <Input
                {...register(`fields_config.fields.${currentFieldIndex}.default_value`)}
                placeholder="Значение по умолчанию"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <Input
                {...register(`fields_config.fields.${currentFieldIndex}.placeholder`)}
                placeholder="Текст подсказки в поле"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFieldOptionsModal(false)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </form>
  );
};

export default DynamicModelForm; 
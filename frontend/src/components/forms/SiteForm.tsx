import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSitesStore } from '../../store';
import type { Site, SiteCreateData, SiteUpdateData } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';

// Zod схема валидации
const siteSchema = z.object({
  name: z.string()
    .min(1, 'Название сайта обязательно')
    .min(3, 'Название должно содержать минимум 3 символа')
    .max(255, 'Название не должно превышать 255 символов'),
  domain: z.string()
    .min(1, 'Домен обязателен')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      'Некорректный формат домена'
    ),
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional(),
  logo: z.union([
    z.instanceof(File),
    z.string(),
    z.null()
  ]).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface SiteFormProps {
  site?: Site | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Форма для создания и редактирования сайтов
 */
const SiteForm: React.FC<SiteFormProps> = ({ 
  site, 
  onSuccess, 
  onCancel 
}) => {
  const { 
    createSite, 
    updateSite, 
    isLoading, 
    clearError 
  } = useSitesStore();

  const isEditing = Boolean(site);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isValid }
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: '',
      domain: '',
      description: '',
    },
  });

  // Загружаем данные сайта для редактирования
  useEffect(() => {
    if (site) {
      reset({
        name: site.name,
        domain: site.domain,
        description: site.description || '',
        meta_title: site.meta_title || '',
        meta_description: site.meta_description || '',
        meta_keywords: site.meta_keywords || '',
      });
    }
  }, [site, reset]);

  // Очищаем ошибки при размонтировании
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const onSubmit = async (data: SiteFormData) => {
    try {
      clearError();
      
      if (isEditing && site) {
        const updateData: SiteUpdateData = {
          name: data.name,
          domain: data.domain,
          description: data.description,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          meta_keywords: data.meta_keywords,
          // Обработка логотипа если необходимо
          ...(data.logo instanceof File && { logo: data.logo }),
        };
        
        await updateSite(site.id, updateData);
      } else {
        const createData: SiteCreateData = {
          name: data.name,
          domain: data.domain,
          description: data.description,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          meta_keywords: data.meta_keywords,
          // Обработка логотипа если необходимо
          ...(data.logo instanceof File && { logo: data.logo }),
        };
        
        await createSite(createData);
      }
      
      onSuccess?.();
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const handleCancel = () => {
    reset();
    clearError();
    onCancel?.();
  };

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Редактировать сайт' : 'Создать новый сайт'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {isEditing 
              ? 'Обновите информацию о вашем сайте'
              : 'Заполните информацию для создания нового сайта'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Название сайта */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Название сайта *
            </label>
            <div className="mt-1">
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.name 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="Мой веб-сайт"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Домен */}
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
              Домен *
            </label>
            <div className="mt-1">
              <input
                id="domain"
                type="text"
                {...register('domain')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.domain 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="example.com"
                disabled={isLoading}
              />
              {errors.domain && (
                <p className="mt-2 text-sm text-red-600">{errors.domain.message}</p>
              )}
            </div>
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Описание
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.description 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="Краткое описание сайта..."
                disabled={isLoading}
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Логотип */}
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
              Логотип
            </label>
            <div className="mt-1">
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setValue('logo', file, { shouldDirty: true });
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF до 2MB
              </p>
            </div>
          </div>

          {/* SEO поля */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">SEO настройки</h3>
            
            {/* Meta Title */}
            <div>
              <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700">
                Meta Title
              </label>
              <div className="mt-1">
                <input
                  id="meta_title"
                  type="text"
                  {...register('meta_title')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Заголовок для поисковых систем"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700">
                Meta Description
              </label>
              <div className="mt-1">
                <textarea
                  id="meta_description"
                  rows={2}
                  {...register('meta_description')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Описание для поисковых систем"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Meta Keywords */}
            <div>
              <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700">
                Meta Keywords
              </label>
              <div className="mt-1">
                <input
                  id="meta_keywords"
                  type="text"
                  {...register('meta_keywords')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Ключевые слова через запятую"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !isValid || (!isDirty && isEditing)}
              loading={isLoading}
            >
              {isLoading 
                ? (isEditing ? 'Сохранение...' : 'Создание...') 
                : (isEditing ? 'Сохранить изменения' : 'Создать сайт')
              }
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default SiteForm; 
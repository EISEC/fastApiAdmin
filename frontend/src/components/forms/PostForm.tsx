import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePostsStore, useSitesStore } from '../../store';
import type { Post, PostCreateData, PostUpdateData, PostStatus, PostVisibility } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';

// Zod схема валидации
const postSchema = z.object({
  title: z.string()
    .min(1, 'Заголовок поста обязателен')
    .min(3, 'Заголовок должен содержать минимум 3 символа')
    .max(255, 'Заголовок не должен превышать 255 символов'),
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'URL slug может содержать только строчные буквы, цифры и дефисы')
    .or(z.literal(''))
    .optional(),
  content: z.string()
    .min(1, 'Содержимое поста обязательно')
    .min(10, 'Содержимое должно содержать минимум 10 символов'),
  excerpt: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .or(z.literal(''))
    .optional(),
  featured_image: z.union([
    z.instanceof(File),
    z.string(),
    z.null()
  ]).optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived'] as const),
  visibility: z.enum(['public', 'private', 'password'] as const),
  site: z.number({
    required_error: 'Выберите сайт для поста',
    invalid_type_error: 'Выберите сайт для поста'
  }).min(1, 'Выберите сайт для поста'),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  post?: Post | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Форма для создания и редактирования постов
 */
const PostForm: React.FC<PostFormProps> = ({ 
  post, 
  onSuccess, 
  onCancel 
}) => {
  const { 
    createPost, 
    updatePost, 
    isLoading, 
    clearError 
  } = usePostsStore();
  
  const { sites, fetchSites } = useSitesStore();

  const isEditing = Boolean(post);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isValid }
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      status: 'draft' as PostStatus,
      visibility: 'public' as PostVisibility,
      // site будет установлен после загрузки сайтов
    },
    mode: 'onChange', // Включаем валидацию при изменении
  });

  const watchedTitle = watch('title');
  const watchedSite = watch('site');

  // Автогенерация slug из заголовка
  useEffect(() => {
    if (watchedTitle && !isEditing) {
      const slug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [watchedTitle, isEditing, setValue]);

  // Загружаем сайты при монтировании
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Устанавливаем первый сайт по умолчанию после загрузки, если не в режиме редактирования
  useEffect(() => {
    if (sites.length > 0 && !isEditing && !watchedSite) {
      setValue('site', sites[0].id, { shouldValidate: true });
    }
  }, [sites, isEditing, setValue, watchedSite]);

  // Загружаем данные поста для редактирования
  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        status: post.status,
        visibility: post.visibility,
        site: post.site,
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || '',
      });
    }
  }, [post, reset]);

  // Очищаем ошибки при размонтировании
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const onSubmit = async (data: PostFormData) => {
    try {
      clearError();
      
      // Проверяем что сайт выбран
      if (!data.site) {
        return;
      }
      
      if (isEditing && post) {
        const updateData: PostUpdateData = {
          title: data.title,
          slug: data.slug,
          content: data.content,
          excerpt: data.excerpt,
          status: data.status,
          visibility: data.visibility,
          site: data.site,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          meta_keywords: data.meta_keywords,
          ...(data.featured_image instanceof File && { featured_image: data.featured_image }),
        };
        
        await updatePost(post.id, updateData);
      } else {
        const createData: PostCreateData = {
          title: data.title,
          slug: data.slug,
          content: data.content,
          excerpt: data.excerpt,
          status: data.status,
          visibility: data.visibility,
          site: data.site,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          meta_keywords: data.meta_keywords,
          ...(data.featured_image instanceof File && { featured_image: data.featured_image }),
        };
        
        await createPost(createData);
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
            {isEditing ? 'Редактировать пост' : 'Создать новый пост'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {isEditing 
              ? 'Обновите содержимое вашего поста'
              : 'Заполните информацию для создания нового поста'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Заголовок */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Заголовок поста *
            </label>
            <div className="mt-1">
              <input
                id="title"
                type="text"
                {...register('title')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.title 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="Заголовок вашего поста"
                disabled={isLoading}
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
          </div>

          {/* URL Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              URL Slug
            </label>
            <div className="mt-1">
              <input
                id="slug"
                type="text"
                {...register('slug')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.slug 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="url-slug-poста"
                disabled={isLoading}
              />
              {errors.slug && (
                <p className="mt-2 text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                URL адрес поста. Автоматически генерируется из заголовка.
              </p>
            </div>
          </div>

          {/* Сайт */}
          <div>
            <label htmlFor="site" className="block text-sm font-medium text-gray-700">
              Сайт *
            </label>
            <div className="mt-1">
              <select
                id="site"
                {...register('site', { valueAsNumber: true })}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.site 
                    ? 'border-red-300 text-red-900' 
                    : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.domain})
                  </option>
                ))}
              </select>
              {errors.site && (
                <p className="mt-2 text-sm text-red-600">{errors.site.message}</p>
              )}
            </div>
          </div>

          {/* Статус */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Статус публикации
            </label>
            <div className="mt-1">
              <select
                id="status"
                {...register('status')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликован</option>
                <option value="scheduled">Запланирован</option>
                <option value="archived">Архивирован</option>
              </select>
            </div>
          </div>

          {/* Видимость */}
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
              Видимость поста
            </label>
            <div className="mt-1">
              <select
                id="visibility"
                {...register('visibility')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="public">Публичный</option>
                <option value="private">Приватный</option>
                <option value="password">Защищенный</option>
              </select>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
              Краткое описание
            </label>
            <div className="mt-1">
              <textarea
                id="excerpt"
                rows={3}
                {...register('excerpt')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.excerpt 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="Краткое описание поста для превью..."
                disabled={isLoading}
              />
              {errors.excerpt && (
                <p className="mt-2 text-sm text-red-600">{errors.excerpt.message}</p>
              )}
            </div>
          </div>

          {/* Содержимое */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Содержимое поста *
            </label>
            <div className="mt-1">
              <textarea
                id="content"
                rows={10}
                {...register('content')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.content 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="Напишите содержимое вашего поста..."
                disabled={isLoading}
              />
              {errors.content && (
                <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
          </div>

          {/* Изображение */}
          <div>
            <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700">
              Главное изображение
            </label>
            <div className="mt-1">
              <input
                id="featured_image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setValue('featured_image', file, { shouldDirty: true });
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF до 5MB
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
                  placeholder="SEO заголовок поста"
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
                  placeholder="SEO описание поста"
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
                : (isEditing ? 'Сохранить изменения' : 'Создать пост')
              }
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default PostForm; 
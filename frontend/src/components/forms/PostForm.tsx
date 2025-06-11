import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePostsStore, useSitesStore } from '../../store';
import type { Post, PostCreateData, PostUpdateData, PostStatus, PostVisibility } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import MDEditor from '../editors/MDEditor';
import CategoryTagManager from '../posts/CategoryTagManager';
import PostPreview from '../posts/PostPreview';
import Modal from '../ui/Modal';
import { clsx } from 'clsx';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import ColorPicker from '../ui/ColorPicker';
import { useToastStore } from '../../store/toastStore';
import Icon from '../ui/Icon';

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
  categories: z.array(z.number()).optional(),
  tags: z.array(z.string()).optional(),
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
    categories,
    tags,
    fetchCategories,
    fetchTags,
    createCategory,
    createTag,
    isLoading, 
    clearError 
  } = usePostsStore();
  
  const { sites, fetchSites } = useSitesStore();

  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  
  // Состояние для модальных окон создания категорий и тегов
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  
  const [newTag, setNewTag] = useState({
    name: '',
    color: '#6B7280'
  });

  const isEditing = Boolean(post);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isDirty, isValid }
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      status: 'draft' as PostStatus,
      visibility: 'public' as PostVisibility,
      categories: [],
      tags: [],
      // site будет установлен после загрузки сайтов
    },
    mode: 'onChange', // Включаем валидацию при изменении
  });

  const watchedTitle = watch('title');
  const watchedSite = watch('site');
  const watchedContent = watch('content');

  const addToast = useToastStore(state => state.addToast);

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

  // Загружаем категории и теги при выборе сайта
  useEffect(() => {
    if (watchedSite) {
      fetchCategories(watchedSite);
      fetchTags(watchedSite);
    }
  }, [watchedSite, fetchCategories, fetchTags]);

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
      
      // Устанавливаем категории и теги
      setSelectedCategories(post.categories?.map(cat => cat.id) || []);
      setSelectedTags(post.tags?.map(tag => tag.id) || []);
    }
  }, [post, reset]);

  // Очищаем ошибки при размонтировании
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handlePreview = () => {
    const formData = watch();
    if (formData.title && formData.content) {
      const mockPost: Post = {
        id: post?.id || 0,
        title: formData.title,
        slug: formData.slug || '',
        content: formData.content,
        excerpt: formData.excerpt || '',
        featured_image: formData.featured_image instanceof File ? URL.createObjectURL(formData.featured_image) : (formData.featured_image as string) || '',
        status: formData.status,
        visibility: formData.visibility,
        author: post?.author || 1,
        author_name: post?.author_name || 'Вы',
        site: formData.site,
        site_name: sites.find(s => s.id === formData.site)?.name || '',
        categories: categories.filter(cat => selectedCategories.includes(cat.id)),
        tags: tags.filter(tag => selectedTags.includes(tag.id)),
        meta_title: formData.meta_title || '',
        meta_description: formData.meta_description || '',
        meta_keywords: formData.meta_keywords || '',
        published_at: post?.published_at,
        views_count: post?.views_count || 0,
        comments_count: post?.comments_count || 0,
        created_at: post?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPreviewPost(mockPost);
      setIsPreviewOpen(true);
    }
  };

  const onSubmit = async (data: PostFormData) => {
    try {
      clearError();
      
      // Проверяем что сайт выбран
      if (!data.site) {
        return;
      }
      
      // Добавляем категории и теги к данным
      const postData = {
        ...data,
        categories: selectedCategories,
        tags: selectedTags,
      };
      
      if (isEditing && post) {
        const updateData: PostUpdateData = {
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          excerpt: postData.excerpt,
          status: postData.status,
          visibility: postData.visibility,
          site: postData.site,
          categories: postData.categories,
          tags: postData.tags,
          meta_title: postData.meta_title,
          meta_description: postData.meta_description,
          meta_keywords: postData.meta_keywords,
          ...(postData.featured_image instanceof File && { featured_image: postData.featured_image }),
        };
        
        await updatePost(post.id, updateData);
      } else {
        const createData: PostCreateData = {
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          excerpt: postData.excerpt,
          status: postData.status,
          visibility: postData.visibility,
          site: postData.site,
          categories: postData.categories,
          tags: postData.tags,
          meta_title: postData.meta_title,
          meta_description: postData.meta_description,
          meta_keywords: postData.meta_keywords,
          ...(postData.featured_image instanceof File && { featured_image: postData.featured_image }),
        };
        
        await createPost(createData);
      }
      
      onSuccess?.();
    } catch (_error) {
      // Ошибка уже обработана в store
    }
  };

  const handleCancel = () => {
    reset();
    clearError();
    setSelectedCategories([]);
    setSelectedTags([]);
    onCancel?.();
  };

  // Функция создания категории
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newCategory.name.trim()) {
      addToast({ type: 'error', title: 'Введите название категории' });
      return;
    }

    if (!watchedSite) {
      addToast({ type: 'error', title: 'Выберите сайт' });
      return;
    }

    setIsCreatingCategory(true);
    try {
      const category = await createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        site: watchedSite,
        color: newCategory.color,
      });
      
      setSelectedCategories([...selectedCategories, category.id]);
      setIsCreateCategoryOpen(false);
      setNewCategory({ name: '', description: '', color: '#3B82F6' });
    } catch (_error) {
      // Ошибка уже обработана в store
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Функция создания тега
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newTag.name.trim()) {
      addToast({ type: 'error', title: 'Введите название тега' });
      return;
    }

    if (!watchedSite) {
      addToast({ type: 'error', title: 'Выберите сайт' });
      return;
    }

    setIsCreatingTag(true);
    try {
      const tag = await createTag({
        name: newTag.name.trim(),
        site: watchedSite,
        color: newTag.color,
      });
      
      setSelectedTags([...selectedTags, tag.id]);
      setIsCreateTagOpen(false);
      setNewTag({ name: '', color: '#6B7280' });
    } catch (_error) {
      // Ошибка уже обработана в store
    } finally {
      setIsCreatingTag(false);
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Редактирование поста' : 'Создание нового поста'}
            </h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePreview}
                disabled={!watchedTitle || !watchedContent}
              >
                <Icon name="eye" size="sm" className="mr-2" />
                Превью
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Основная информация */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
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
                      placeholder="Введите заголовок поста"
                      disabled={isLoading}
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  URL slug
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
                    placeholder="url-slug-dlya-posta"
                    disabled={isLoading}
                  />
                  {errors.slug && (
                    <p className="mt-2 text-sm text-red-600">{errors.slug.message}</p>
                  )}
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
                    <option value="">Выберите сайт</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  {errors.site && (
                    <p className="mt-2 text-sm text-red-600">{errors.site.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Содержимое с MD Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Содержимое поста *
              </label>
              <Controller
                name="content"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <MDEditor
                      value={field.value}
                      onChange={field.onChange}
                      height={400}
                      placeholder="Напишите содержимое вашего поста..."
                      className={clsx(
                        fieldState.error && 'border-red-500'
                      )}
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Категории и теги */}
            <CategoryTagManager
              categories={categories}
              tags={tags}
              selectedCategories={selectedCategories}
              selectedTags={selectedTags}
              onCategoriesChange={setSelectedCategories}
              onTagsChange={setSelectedTags}
              siteId={watchedSite}
              onCreateCategory={() => setIsCreateCategoryOpen(true)}
              onCreateTag={() => setIsCreateTagOpen(true)}
            />

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

      {isPreviewOpen && previewPost && (
        <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)}>
          <div className="p-6">
            <PostPreview post={previewPost} />
          </div>
        </Modal>
      )}

      {/* Модальное окно создания категории */}
      <Modal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        title="Создать новую категорию"
        size="sm"
      >
        <div className="p-6">
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <Input
                label="Название категории"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Введите название..."
                disabled={isCreatingCategory}
                required
              />
            </div>

            <div>
              <Textarea
                label="Описание"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Краткое описание категории..."
                rows={3}
                disabled={isCreatingCategory}
              />
            </div>

            <div>
              <ColorPicker
                label="Цвет"
                value={newCategory.color}
                onChange={(color) => setNewCategory({ ...newCategory, color })}
                disabled={isCreatingCategory}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isCreatingCategory || !newCategory.name.trim()}
                loading={isCreatingCategory}
              >
                Создать категорию
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateCategoryOpen(false)}
                disabled={isCreatingCategory}
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Модальное окно создания тега */}
      <Modal
        isOpen={isCreateTagOpen}
        onClose={() => setIsCreateTagOpen(false)}
        title="Создать новый тег"
        size="sm"
      >
        <div className="p-6">
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div>
              <Input
                label="Название тега"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="Введите название..."
                disabled={isCreatingTag}
                required
              />
            </div>

            <div>
              <ColorPicker
                label="Цвет"
                value={newTag.color}
                onChange={(color) => setNewTag({ ...newTag, color })}
                disabled={isCreatingTag}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isCreatingTag || !newTag.name.trim()}
                loading={isCreatingTag}
              >
                Создать тег
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateTagOpen(false)}
                disabled={isCreatingTag}
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default PostForm; 
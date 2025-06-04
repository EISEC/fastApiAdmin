import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { api } from '../../lib/axios.config';
import { generateSlugFromText } from '../../utils/helpers';

interface PageFormData {
  title: string;
  content: string;
  slug: string;
  image: File | null;
  is_published: boolean;
  is_homepage: boolean;
  template_name: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  site: number;
}

interface Site {
  id: number;
  name: string;
  domain: string;
}

interface PageFormProps {
  page?: {
    id: number;
    title: string;
    content: string;
    slug: string;
    image?: string;
    is_published: boolean;
    is_homepage: boolean;
    template_name: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    site: number;
    site_name?: string;
    author: number;
    author_name?: string;
    created_at: string;
    updated_at: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Форма создания и редактирования страницы
 */
const PageForm: React.FC<PageFormProps> = ({ page, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<PageFormData>({
    title: page?.title || '',
    content: page?.content || '',
    slug: page?.slug || '',
    image: null,
    is_published: page?.is_published ?? false,
    is_homepage: page?.is_homepage ?? false,
    template_name: page?.template_name || 'default',
    meta_title: page?.meta_title || '',
    meta_description: page?.meta_description || '',
    meta_keywords: page?.meta_keywords || '',
    site: page?.site || 0,
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoadingSites(true);
        const data = await api.get<{results?: Site[], count?: number}>('/sites/');
        setSites(Array.isArray(data) ? data : (data.results || []));
      } catch (error: unknown) {
        console.error('Error fetching sites:', error);
      } finally {
        setLoadingSites(false);
      }
    };

    fetchSites();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'site') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Автогенерация slug из заголовка
    if (name === 'title') {
      // Генерируем slug только если поле slug пустое или пользователь явно его не менял
      if (!formData.slug || formData.slug === generateSlugFromText(formData.title)) {
        const slug = generateSlugFromText(value);
        setFormData(prev => ({ ...prev, slug }));
      }
    }
    
    // Автогенерация meta_title из заголовка
    if (name === 'title' && !formData.meta_title) {
      setFormData(prev => ({ ...prev, meta_title: value }));
    }
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
    
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Заголовок обязателен';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Содержание обязательно';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'URL slug обязателен';
    }

    if (!formData.site) {
      newErrors.site = 'Выберите сайт';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Если есть файл изображения, используем FormData
      if (formData.image) {
        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('content', formData.content);
        submitData.append('slug', formData.slug);
        submitData.append('is_published', formData.is_published.toString());
        submitData.append('is_homepage', formData.is_homepage.toString());
        submitData.append('template_name', formData.template_name);
        submitData.append('meta_title', formData.meta_title);
        submitData.append('meta_description', formData.meta_description);
        submitData.append('meta_keywords', formData.meta_keywords);
        submitData.append('site', formData.site.toString());
        submitData.append('image', formData.image);

        if (page) {
          // Для обновления с файлом используем PUT
          await api.put(`/pages/${page.id}/`, submitData);
        } else {
          // Создание новой страницы
          await api.post('/pages/', submitData);
        }
      } else {
        // Если нет файла, отправляем обычный JSON
        const submitData = {
          title: formData.title,
          content: formData.content,
          slug: formData.slug,
          is_published: formData.is_published,
          is_homepage: formData.is_homepage,
          template_name: formData.template_name,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          meta_keywords: formData.meta_keywords,
          site: formData.site,
        };

        if (page) {
          // Обновление без файла
          await api.patch(`/pages/${page.id}/`, submitData);
        } else {
          // Создание без файла
          await api.post('/pages/', submitData);
        }
      }

      onSuccess();
    } catch (error: unknown) {
      const apiError = error as { response?: { data: Record<string, unknown> }; message?: string };
      if (apiError.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(apiError.response.data).forEach(key => {
          const value = apiError.response!.data[key];
          apiErrors[key] = Array.isArray(value) 
            ? (value[0] as string)
            : (value as string);
        });
        setErrors(apiErrors);
      } else {
        setErrors({ general: apiError.message || 'Произошла ошибка при сохранении' });
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'content', label: 'Содержание', icon: 'edit' },
    { id: 'seo', label: 'SEO', icon: 'search' },
    { id: 'settings', label: 'Настройки', icon: 'settings' },
  ] as const;

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Icon name={page ? "edit" : "add"} size="lg" className="mr-2" />
            {page ? 'Редактировать страницу' : 'Создать новую страницу'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {page 
              ? 'Обновите содержимое и настройки существующей страницы'
              : 'Заполните информацию для создания новой страницы сайта'
            }
          </p>
        </div>

        {/* Error Alert */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="warning" size="lg" color="danger" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка сохранения</h3>
                <div className="mt-1 text-sm text-red-700">{errors.general}</div>
              </div>
            </div>
          </div>
        )}

        {/* Elegant Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className={`mr-2 transition-transform duration-200 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    <Icon name={tab.icon as any} size="md" />
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Заголовок */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Заголовок *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Введите заголовок страницы"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* URL Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  URL адрес *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.slug ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="url-adres-stranitsy"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                )}
              </div>

              {/* Содержание */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Содержание *
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={12}
                  value={formData.content}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.content ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Введите содержание страницы..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>

              {/* Изображение */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                  Изображение страницы
                </label>
                <div className="flex items-center space-x-4">
                  {page?.image && (
                    <img
                      src={page.image}
                      alt="Текущее изображение"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                )}
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* Meta Title */}
              <div>
                <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  id="meta_title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="SEO заголовок страницы"
                />
              </div>

              {/* Meta Description */}
              <div>
                <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  id="meta_description"
                  name="meta_description"
                  rows={3}
                  value={formData.meta_description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Краткое описание страницы для поисковых систем"
                />
              </div>

              {/* Meta Keywords */}
              <div>
                <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  id="meta_keywords"
                  name="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ключевые, слова, через, запятую"
                />
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Сайт */}
              <div>
                <label htmlFor="site" className="block text-sm font-medium text-gray-700 mb-1">
                  Сайт *
                </label>
                <select
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  disabled={loadingSites}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.site ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value={0}>Выберите сайт</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.domain})
                    </option>
                  ))}
                </select>
                {errors.site && (
                  <p className="mt-1 text-sm text-red-600">{errors.site}</p>
                )}
              </div>

              {/* Шаблон */}
              <div>
                <label htmlFor="template_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Шаблон
                </label>
                <select
                  id="template_name"
                  name="template_name"
                  value={formData.template_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="default">По умолчанию</option>
                  <option value="landing">Лендинг</option>
                  <option value="blog">Блог</option>
                  <option value="contacts">Контакты</option>
                </select>
              </div>

              {/* Статусы */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                    Опубликовать страницу
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_homepage"
                    name="is_homepage"
                    checked={formData.is_homepage}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_homepage" className="ml-2 block text-sm text-gray-900">
                    Сделать главной страницей сайта
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {page ? 'Сохранить изменения' : 'Создать страницу'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default PageForm; 
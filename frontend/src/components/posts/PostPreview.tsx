import React from 'react';
import { clsx } from 'clsx';
import Icon from '../ui/Icon';
import type { Post } from '../../types/post.types';

interface PostPreviewProps {
  post: Post;
  className?: string;
  showFullContent?: boolean;
  onEdit?: () => void;
  onClose?: () => void;
}

/**
 * Компонент для предварительного просмотра поста
 * Отображает содержимое поста в том виде, как оно будет выглядеть на сайте
 */
const PostPreview: React.FC<PostPreviewProps> = ({
  post,
  className,
  showFullContent = true,
  onEdit,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
      case 'archived':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Опубликован';
      case 'draft':
        return 'Черновик';
      case 'archived':
        return 'Архивирован';
      default:
        return status;
    }
  };

  // Вычисляем время чтения на основе содержимого
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, ''); // Убираем HTML теги
    const wordCount = textContent.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const readingTime = calculateReadingTime(post.content);

  return (
    <div className={clsx('bg-white rounded-lg shadow-lg overflow-hidden', className)}>
      {/* Заголовок превью */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="eye" size="sm" />
            <h2 className="text-lg font-semibold">Предварительный просмотр</h2>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm transition-colors"
              >
                <Icon name="edit" size="xs" className="mr-1" />
                Редактировать
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-md transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Контент поста */}
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Мета информация */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-gray-600 text-lg leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0">
              <span className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium',
                getStatusColor(post.status)
              )}>
                {getStatusText(post.status)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Icon name="calendar" size="xs" className="mr-1" />
              {formatDate(post.created_at)}
            </div>
            {post.author_name && (
              <div className="flex items-center">
                <Icon name="user" size="xs" className="mr-1" />
                {post.author_name}
              </div>
            )}
            {post.site_name && (
              <div className="flex items-center">
                <Icon name="globe" size="xs" className="mr-1" />
                {post.site_name}
              </div>
            )}
            {readingTime && (
              <div className="flex items-center">
                <Icon name="clock" size="xs" className="mr-1" />
                {readingTime} мин чтения
              </div>
            )}
            <div className="flex items-center">
              <Icon name="eye" size="xs" className="mr-1" />
              {post.views_count || 0} просмотров
            </div>
          </div>

          {/* Категории и теги */}
          {(post.categories?.length > 0 || post.tags?.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.categories?.map((category) => (
                <span
                  key={category.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                >
                  <Icon name="folder" size="xs" className="mr-1" />
                  {category.name}
                </span>
              ))}
              {post.tags?.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                >
                  <Icon name="tag" size="xs" className="mr-1" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Изображение поста */}
        {post.featured_image && (
          <div className="px-6 pt-6">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Содержимое поста */}
        <div className="p-6">
          <div className="prose prose-lg max-w-none">
            {showFullContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: post.content }}
                className="post-content"
              />
            ) : (
              <div className="text-gray-600">
                {post.excerpt || 'Превью содержимого недоступно'}
              </div>
            )}
          </div>
        </div>

        {/* SEO информация */}
        {(post.meta_title || post.meta_description) && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                <Icon name="search" size="xs" className="mr-1" />
                SEO Превью
              </h3>
              {post.meta_title && (
                <div className="mb-2">
                  <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                    {post.meta_title}
                  </div>
                </div>
              )}
              {post.meta_description && (
                <div className="text-gray-600 text-sm leading-relaxed">
                  {post.meta_description}
                </div>
              )}
              <div className="text-green-700 text-sm mt-1">
                {window.location.origin}/posts/{post.slug}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .post-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        .post-content pre {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
        }
        .post-content blockquote {
          border-left: 4px solid #e5e7eb;
          margin: 24px 0;
          padding: 16px 24px;
          background: #f9fafb;
          font-style: italic;
        }
        .post-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 24px 0;
        }
        .post-content table td,
        .post-content table th {
          border: 1px solid #d1d5db;
          padding: 12px;
          text-align: left;
        }
        .post-content table th {
          background: #f3f4f6;
          font-weight: 600;
        }
        .post-content h1,
        .post-content h2,
        .post-content h3,
        .post-content h4,
        .post-content h5,
        .post-content h6 {
          margin-top: 32px;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .post-content p {
          margin-bottom: 16px;
          line-height: 1.7;
        }
        .post-content ul,
        .post-content ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }
        .post-content li {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default PostPreview; 
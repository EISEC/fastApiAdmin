import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { usePostsStore, useToastStore, useSitesStore } from '../../store';
import type { PostListItem, PostStatus } from '../../types';
import type { TableColumn, SortConfig } from '../ui/Table';

interface PostsTableProps {
  className?: string;
  siteId?: number;
}

/**
 * Компонент таблицы постов с фильтрацией и действиями
 */
const PostsTable: React.FC<PostsTableProps> = ({ className, siteId }) => {
  const navigate = useNavigate();
  const { posts, isLoading, deletePost, duplicatePost, changeStatus } = usePostsStore();
  const { success, error } = useToastStore();
  const { sites } = useSitesStore();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'created_at',
    direction: 'desc'
  });

  // Сортированные и отфильтрованные данные
  const processedPosts = useMemo(() => {
    let filteredPosts = posts;
    
    // Фильтрация по сайту если указан
    if (siteId) {
      const selectedSite = sites.find(site => site.id === siteId);
      if (selectedSite) {
        filteredPosts = posts.filter(post => post.site_name === selectedSite.name);
      }
    }
    
    // Сортировка
    if (!sortConfig.field) return filteredPosts;
    
    return [...filteredPosts].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof PostListItem];
      const bValue = b[sortConfig.field as keyof PostListItem];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [posts, siteId, sites, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (post: PostListItem) => {
    navigate(`/posts/${post.id}/edit`);
  };

  const handleDelete = async (post: PostListItem) => {
    if (window.confirm(`Вы уверены, что хотите удалить пост "${post.title}"?`)) {
      try {
        await deletePost(post.id);
        success('Пост удален', `Пост "${post.title}" был успешно удален`);
      } catch {
        error('Ошибка удаления', 'Не удалось удалить пост');
      }
    }
  };

  const handleDuplicate = async (post: PostListItem) => {
    try {
      await duplicatePost(post.id);
      success('Пост скопирован', `Копия поста "${post.title}" создана`);
    } catch {
      error('Ошибка копирования', 'Не удалось скопировать пост');
    }
  };

  const handleStatusChange = async (post: PostListItem, newStatus: PostStatus) => {
    try {
      await changeStatus(post.id, newStatus);
      const statusText = {
        draft: 'черновик',
        published: 'опубликован',
        scheduled: 'запланирован',
        archived: 'архивирован'
      }[newStatus];
      success('Статус изменен', `Пост переведен в статус "${statusText}"`);
    } catch {
      error('Ошибка', 'Не удалось изменить статус поста');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: PostStatus) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      published: 'bg-green-100 text-green-800 border-green-300',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      archived: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };

    const icons = {
      draft: 'file',
      published: 'check',
      scheduled: 'clock',
      archived: 'folder',
    } as const;

    const labels = {
      draft: 'Черновик',
      published: 'Опубликован',
      scheduled: 'Запланирован',
      archived: 'Архивирован',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${styles[status]}`}>
        <Icon name={icons[status]} size="xs" className="mr-1" />
        {labels[status]}
      </span>
    );
  };

  // Конфигурация колонок
  const columns: TableColumn<PostListItem>[] = [
    {
      key: 'title',
      label: 'Пост',
      sortable: true,
      render: (value, post) => (
        <div className="flex items-center group">
          <div className="flex-shrink-0 h-12 w-12 mr-4">
            {post.featured_image ? (
              <img
                className="h-12 w-12 rounded-xl object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                src={post.featured_image}
                alt={`${post.title} thumbnail`}
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-300 transition-all">
                <Icon name="file" color="white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {String(value)}
            </div>
            <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors flex items-center">
              <Icon name="link" size="xs" className="mr-1" />
              /{post.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'author_name',
      label: 'Автор',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-xs">
              {String(value).charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'site_name',
      label: 'Сайт',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <Icon name="globe" size="xs" className="mr-1" />
          {String(value)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Статус',
      sortable: true,
      align: 'center',
      render: (value, post) => (
        <div className="flex justify-center">
          <select
            value={String(value)}
            onChange={(e) => handleStatusChange(post, e.target.value as PostStatus)}
            className={`text-xs rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 font-semibold ${
              value === 'published' ? 'bg-green-50 text-green-700 border-green-300' :
              value === 'draft' ? 'bg-gray-50 text-gray-700 border-gray-300' :
              value === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-300' :
              'bg-yellow-50 text-yellow-700 border-yellow-300'
            }`}
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
            <option value="scheduled">Запланирован</option>
            <option value="archived">Архивирован</option>
          </select>
        </div>
      ),
    },
    {
      key: 'views_count',
      label: 'Просмотры',
      sortable: true,
      align: 'center',
      render: (value) => (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{String(value) || '0'}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center">
            <Icon name="eye" size="xs" className="mr-1" />
            просмотров
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Создан',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          <div className="text-gray-900 font-medium">
            {formatDate(String(value))}
          </div>
          <div className="text-gray-500 text-xs flex items-center">
            <Icon name="calendar" size="xs" className="mr-1" />
            {new Date(String(value)).toLocaleDateString('ru-RU', { weekday: 'short' })}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      align: 'right',
      width: '220px',
      render: (_, post) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEdit(post)}
            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors group"
          >
            <Icon name="edit" size="sm" className="mr-1" />
            Редактировать
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDuplicate(post)}
            className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors group"
          >
            <Icon name="copy" size="sm" className="mr-1" />
            Копировать
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(post)}
            className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors group"
          >
            <Icon name="delete" size="sm" className="mr-1" />
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={className}>
      <Table
        data={processedPosts}
        columns={columns}
        loading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}
        emptyMessage="Нет созданных постов. Создайте первый пост!"
      />
    </div>
  );
};

export default PostsTable; 
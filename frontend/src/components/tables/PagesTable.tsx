import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { usePagesStore, useToastStore, useAuthStore, useSitesStore } from '../../store';
import type { PageListItem, PageStatus } from '../../types';
import type { TableColumn, SortConfig } from '../ui/Table';

interface PagesTableProps {
  className?: string;
  siteId?: number;
}

/**
 * Компонент таблицы страниц с фильтрацией и действиями
 */
const PagesTable: React.FC<PagesTableProps> = ({ className, siteId }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pages, isLoading, deletePage, changeStatus, setHomepage } = usePagesStore();
  const { success, error } = useToastStore();
  const { sites } = useSitesStore();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'created_at',
    direction: 'desc'
  });

  // Сортированные и отфильтрованные данные
  const processedPages = useMemo(() => {
    let filteredPages = pages;
    
    // Фильтрация по сайту если указан
    if (siteId) {
      const selectedSite = sites.find(site => site.id === siteId);
      if (selectedSite) {
        filteredPages = pages.filter(page => page.site_name === selectedSite.name);
      }
    }
    
    // Сортировка
    if (!sortConfig.field) return filteredPages;
    
    return [...filteredPages].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof PageListItem];
      const bValue = b[sortConfig.field as keyof PageListItem];
      
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
  }, [pages, siteId, sites, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (page: PageListItem) => {
    navigate(`/pages/${page.id}/edit`);
  };

  const handleDelete = async (page: PageListItem) => {
    if (window.confirm(`Вы уверены, что хотите удалить страницу "${page.title}"?`)) {
      try {
        await deletePage(page.id);
        success('Страница удалена', `Страница "${page.title}" была успешно удалена`);
      } catch {
        error('Ошибка удаления', 'Не удалось удалить страницу');
      }
    }
  };

  const handleStatusChange = async (page: PageListItem, newStatus: PageStatus) => {
    try {
      await changeStatus(page.id, newStatus);
      const statusText = {
        draft: 'черновик',
        published: 'опубликована',
        private: 'приватная'
      }[newStatus];
      success('Статус изменен', `Страница переведена в статус "${statusText}"`);
    } catch {
      error('Ошибка', 'Не удалось изменить статус страницы');
    }
  };

  const handleSetHomepage = async (page: PageListItem) => {
    try {
      await setHomepage(page.id);
      success('Главная страница', `Страница "${page.title}" установлена как главная`);
    } catch {
      error('Ошибка', 'Не удалось установить главную страницу');
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

  const getStatusBadge = (status: PageStatus, isHomepage?: boolean) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      published: 'bg-green-100 text-green-800 border-green-300',
      private: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };

    const icons = {
      draft: 'file',
      published: 'check',
      private: 'lock',
    } as const;

    const labels = {
      draft: 'Черновик',
      published: 'Опубликована',
      private: 'Приватная',
    };

    return (
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${styles[status]}`}>
          <Icon name={icons[status]} size="xs" className="mr-1" />
          {labels[status]}
        </span>
        {isHomepage && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
            <Icon name="home" size="xs" className="mr-1" />
            Главная
          </span>
        )}
      </div>
    );
  };

  const getPageTypeIcon = (hasParent: boolean): 'file' => {
    return 'file'; // Используем одну иконку для всех типов страниц
  };

  // Конфигурация колонок
  const columns: TableColumn<PageListItem>[] = [
    {
      key: 'title',
      label: 'Страница',
      sortable: true,
      render: (value, page) => (
        <div className="flex items-center group">
          <div className="flex-shrink-0 h-12 w-12 mr-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-300 transition-all">
              <Icon name={getPageTypeIcon(!!page.parent_title)} color="white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {String(value)}
            </div>
            <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors flex items-center">
              <Icon name="link" size="xs" className="mr-1" />
              /{page.slug}
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
          <div className="h-8 w-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mr-3">
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
        <div className="flex items-center">
          <div className="h-6 w-6 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mr-2">
            <Icon name="globe" size="xs" color="white" />
          </div>
          <span className="text-sm text-gray-900">{String(value) || 'Без сайта'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Статус',
      sortable: true,
      render: (value, page) => getStatusBadge(value as PageStatus, page.is_homepage),
    },
    {
      key: 'parent_title',
      label: 'Тип',
      sortable: false,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? (
            <span className="flex items-center">
              <Icon name="file" size="xs" className="mr-1" />
              Дочерняя
            </span>
          ) : (
            <span className="flex items-center">
              <Icon name="file" size="xs" className="mr-1" />
              Основная
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Создана',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-600">
          <div className="font-medium">
            {formatDate(String(value))}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
      sortable: false,
      render: (_, page) => (
        <div className="flex items-center space-x-2">
          {!page.is_homepage && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSetHomepage(page)}
              disabled={isLoading}
              className="!px-2 !py-1 !text-xs"
            >
              <Icon name="home" size="xs" className="mr-1" />
              Главная
            </Button>
          )}
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleStatusChange(page, page.status === 'published' ? 'draft' : 'published')}
            disabled={isLoading}
            className="!px-2 !py-1 !text-xs"
          >
            {page.status === 'published' ? (
              <>
                <Icon name="file" size="xs" className="mr-1" />
                Скрыть
              </>
            ) : (
              <>
                <Icon name="check" size="xs" className="mr-1" />
                Опубликовать
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEdit(page)}
            className="!px-2 !py-1 !text-xs"
          >
            <Icon name="edit" size="xs" className="mr-1" />
            Изменить
          </Button>
          
          {(user?.role?.name === 'superuser') && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(page)}
              disabled={isLoading}
              className="!px-2 !py-1 !text-xs"
            >
              <Icon name="delete" size="xs" className="mr-1" />
              Удалить
            </Button>
          )}
        </div>
      ),
    },
  ];

  const emptyMessage = siteId 
    ? 'Нет страниц для данного сайта' 
    : 'Нет страниц. Создайте первую страницу!';

  return (
    <div className={className}>
      <Table
        data={processedPages}
        columns={columns}
        loading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}
        emptyMessage={emptyMessage}
        showIndex={false}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      />
    </div>
  );
};

export default PagesTable; 
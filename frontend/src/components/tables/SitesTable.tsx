import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table, { type TableColumn, type SortConfig } from '../ui/Table';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { useSitesStore, useToastStore } from '../../store';
import type { Site } from '../../types';

interface SitesTableProps {
  className?: string;
}

/**
 * Компонент таблицы сайтов с действиями
 */
const SitesTable: React.FC<SitesTableProps> = ({ className }) => {
  const navigate = useNavigate();
  const { sites, isLoading, deleteSite, toggleActive } = useSitesStore();
  const { success, error } = useToastStore();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'created_at',
    direction: 'desc'
  });

  // Сортированные данные
  const sortedSites = useMemo(() => {
    if (!sortConfig.field) return sites;
    
    return [...sites].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof Site];
      const bValue = b[sortConfig.field as keyof Site];
      
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
  }, [sites, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (site: Site) => {
    navigate(`/sites/${site.id}/edit`);
  };

  const handleDelete = async (site: Site) => {
    if (window.confirm(`Вы уверены, что хотите удалить сайт "${site.name}"?`)) {
      try {
        await deleteSite(site.id);
        success('Сайт удален', `Сайт "${site.name}" был успешно удален`);
      } catch {
        error('Ошибка удаления', 'Не удалось удалить сайт');
      }
    }
  };

  const handleToggleStatus = async (site: Site) => {
    try {
      await toggleActive(site.id);
      const status = site.is_active ? 'деактивирован' : 'активирован';
      success('Статус изменен', `Сайт "${site.name}" ${status}`);
    } catch {
      error('Ошибка', 'Не удалось изменить статус сайта');
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

  // Конфигурация колонок
  const columns: TableColumn<Site>[] = [
    {
      key: 'name',
      label: 'Сайт',
      sortable: true,
      render: (value, site) => (
        <div className="flex items-center group">
          <div className="flex-shrink-0 h-10 w-10 mr-4">
            {site.logo ? (
              <img
                className="h-10 w-10 rounded-xl object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                src={site.logo}
                alt={`${site.name} logo`}
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-300 transition-all">
                <span className="text-white font-bold text-lg">
                  {String(value).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {String(value)}
            </div>
            <div className="text-sm text-gray-500 truncate group-hover:text-gray-600 transition-colors">
              <Icon name="globe" size="sm" className="mr-1 inline" />
              {site.domain}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Описание',
      render: (value) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 line-clamp-2">
            {String(value) || <span className="text-gray-400 italic">Описание не указано</span>}
          </p>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Статус',
      sortable: true,
      align: 'center',
      render: (value, site) => (
        <button
          onClick={() => handleToggleStatus(site)}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            value
              ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 focus:ring-green-500'
              : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 focus:ring-red-500'
          }`}
        >
          <span className={`w-2 h-2 mr-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {value ? 'Активен' : 'Неактивен'}
        </button>
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
      width: '180px',
      render: (_, site) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEdit(site)}
            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors group"
          >
            <Icon name="edit" size="sm" className="mr-1" />
            Редактировать
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(site)}
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
        data={sortedSites}
        columns={columns}
        loading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}
        emptyMessage="Нет созданных сайтов. Создайте первый сайт!"
      />
    </div>
  );
};

export default SitesTable; 
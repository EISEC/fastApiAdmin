import React from 'react';
import type { ReactNode } from 'react';
import Icon from './Icon';

// Типы для конфигурации колонок
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, item: T, index: number) => ReactNode;
}

// Типы для сортировки
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Пропсы основного компонента Table
interface TableProps<T extends { id?: string | number }> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  sortConfig?: SortConfig;
  onSort?: (field: string) => void;
  emptyMessage?: string;
  className?: string;
  showIndex?: boolean;
}

/**
 * Базовый компонент таблицы с поддержкой сортировки
 */
function Table<T extends { id?: string | number }>({
  data,
  columns,
  loading = false,
  sortConfig,
  onSort,
  emptyMessage = 'Нет данных для отображения',
  className = '',
  showIndex = false,
}: TableProps<T>) {
  
  const handleSort = (field: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field: string, sortable?: boolean) => {
    if (!sortable || !sortConfig) return null;
    
    const isActive = sortConfig.field === field;
    
    return (
      <span className="ml-2 inline-flex flex-col">
        <Icon 
          name="arrowUp"
          size="xs"
          className={`transition-colors ${isActive && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
        />
        <Icon 
          name="arrowDown" 
          size="xs"
          className={`-mt-1 transition-colors ${isActive && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
        />
      </span>
    );
  };

  const renderCellContent = (column: TableColumn<T>, item: T, index: number): ReactNode => {
    if (column.render) {
      return column.render((item as Record<string, unknown>)[String(column.key)], item, index);
    }
    
    const value = (item as Record<string, unknown>)[String(column.key)];
    
    // Обработка разных типов данных
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">—</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
          value 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <span className={`w-1.5 h-1.5 mr-1 rounded-full ${value ? 'bg-green-400' : 'bg-red-400'}`}></span>
          {value ? 'Да' : 'Нет'}
        </span>
      );
    }
    
    return String(value);
  };

  if (loading) {
    return (
      <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <Icon name="file" size="2xl" className="mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {showIndex && (
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  №
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable 
                      ? 'cursor-pointer hover:bg-gray-100 select-none' 
                      : ''
                  } ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => handleSort(String(column.key), column.sortable)}
                >
                  <div className="flex items-center">
                    <span>{column.label}</span>
                    {getSortIcon(String(column.key), column.sortable)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr 
                key={item.id || index} 
                className="hover:bg-gray-50 transition-colors"
              >
                {showIndex && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                )}
                
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {renderCellContent(column, item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table; 
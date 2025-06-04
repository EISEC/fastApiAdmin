import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { useUsersStore, useToastStore } from '../../store';
import type { User } from '../../types';
import type { TableColumn, SortConfig } from '../ui/Table';

interface UsersTableProps {
  className?: string;
  siteId?: number;
}

/**
 * Компонент таблицы пользователей с действиями
 */
const UsersTable: React.FC<UsersTableProps> = ({ className, siteId }) => {
  const navigate = useNavigate();
  const { users, isLoading, deleteUser, toggleUserStatus } = useUsersStore();
  const { success, error } = useToastStore();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'created_at',
    direction: 'desc'
  });

  // Сортированные и отфильтрованные данные
  const sortedUsers = useMemo(() => {
    let filteredUsers = users;
    
    // Фильтрация по сайту если указан (пока упрощенная логика)
    if (siteId) {
      // В будущем здесь можно добавить фильтрацию по assigned_sites
      // если такое поле будет добавлено в модель User
      filteredUsers = users; // пока показываем всех
    }
    
    if (!sortConfig.field) return filteredUsers;
    
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof User];
      const bValue = b[sortConfig.field as keyof User];
      
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
  }, [users, siteId, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (user: User) => {
    navigate(`/users/${user.id}/edit`);
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${user.username}"?`)) {
      try {
        await deleteUser(user.id);
        success('Пользователь удален', `Пользователь "${user.username}" был успешно удален`);
      } catch {
        error('Ошибка удаления', 'Не удалось удалить пользователя');
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id);
      const status = user.is_active ? 'заблокирован' : 'активирован';
      success('Статус изменен', `Пользователь "${user.username}" ${status}`);
    } catch {
      error('Ошибка', 'Не удалось изменить статус пользователя');
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

  const getRoleBadge = (roleName: string) => {
    const styles = {
      superuser: 'bg-purple-100 text-purple-800 border-purple-300',
      admin: 'bg-blue-100 text-blue-800 border-blue-300',
      author: 'bg-green-100 text-green-800 border-green-300',
      viewer: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    const icons = {
      superuser: 'star',
      admin: 'settings',
      author: 'edit',
      viewer: 'eye',
    } as const;

    const labels = {
      superuser: 'Супер админ',
      admin: 'Администратор',
      author: 'Автор',
      viewer: 'Просмотр',
    };

    const style = styles[roleName as keyof typeof styles] || styles.viewer;
    const icon = icons[roleName as keyof typeof icons] || icons.viewer;
    const label = labels[roleName as keyof typeof labels] || roleName;

    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${style}`}>
        <Icon name={icon} size="xs" className="mr-1" />
        {label}
      </span>
    );
  };

  // Конфигурация колонок
  const columns: TableColumn<User>[] = [
    {
      key: 'username',
      label: 'Пользователь',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center group">
          <div className="flex-shrink-0 h-10 w-10 mr-4">
            {user.avatar ? (
              <img
                className="h-10 w-10 rounded-xl object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                src={user.avatar}
                alt={`${user.username} avatar`}
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-300 transition-all">
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
            <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors flex items-center">
              <Icon name="mail" size="xs" className="mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'first_name',
      label: 'Имя',
      sortable: true,
      render: (value, user) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            {user.first_name && user.last_name ? (
              <>
                <Icon name="user" size="xs" className="mr-1" />
                Полное имя
              </>
            ) : (
              <>
                <Icon name="question" size="xs" className="mr-1" />
                Имя не указано
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Роль',
      sortable: true,
      align: 'center',
      render: (value, user) => (
        <div className="flex justify-center">
          {getRoleBadge(user.role?.name || 'viewer')}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Статус',
      sortable: true,
      align: 'center',
      render: (value, user) => (
        <button
          onClick={() => handleToggleStatus(user)}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            value
              ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 focus:ring-green-500'
              : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 focus:ring-red-500'
          }`}
        >
          <span className={`w-2 h-2 mr-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {value ? (
            <>
              <Icon name="check" size="xs" className="mr-1" />
              Активен
            </>
          ) : (
            <>
              <Icon name="cancel" size="xs" className="mr-1" />
              Заблокирован
            </>
          )}
        </button>
      ),
    },
    {
      key: 'last_login',
      label: 'Последний вход',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {value ? (
            <>
              <div className="text-gray-900 font-medium">
                {formatDate(String(value))}
              </div>
              <div className="text-gray-500 text-xs flex items-center">
                <Icon name="clock" size="xs" className="mr-1" />
                {new Date(String(value)).toLocaleDateString('ru-RU', { weekday: 'short' })}
              </div>
            </>
          ) : (
            <span className="text-gray-400 italic flex items-center">
              <Icon name="cancel" size="xs" className="mr-1" />
              Никогда
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Регистрация',
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
      render: (_, user) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEdit(user)}
            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors group"
          >
            <Icon name="edit" size="sm" className="mr-1" />
            Редактировать
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(user)}
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
        data={sortedUsers}
        columns={columns}
        loading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}
        emptyMessage="Нет зарегистрированных пользователей."
      />
    </div>
  );
};

export default UsersTable; 
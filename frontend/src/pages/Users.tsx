import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import UsersTable from '../components/tables/UsersTable';
import StatsCard from '../components/ui/StatsCard';
import SiteFilter from '../components/ui/SiteFilter';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { useUsersStore, useSitesStore, useAuthStore } from '../store';

/**
 * Страница управления пользователями
 */
const Users: React.FC = () => {
  const navigate = useNavigate();
  const { fetchUsers, users, isLoading, error } = useUsersStore();
  const { sites } = useSitesStore();
  const { isAuthenticated } = useAuthStore();
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);

  // Загружаем пользователей при монтировании
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Фильтрация пользователей по сайтам (пока упрощенная логика)
  const filteredUsers = selectedSiteId 
    ? users.filter(user => {
        // Здесь можно добавить более сложную логику фильтрации
        // например, по assigned_sites если такое поле есть в пользователе
        return true; // пока показываем всех
      })
    : users;

  // Вычисление статистики для отфильтрованных данных
  const activeUsers = filteredUsers.filter(user => user.is_active);
  const inactiveUsers = filteredUsers.filter(user => !user.is_active);
  const roleStats = filteredUsers.reduce((acc, user) => {
    const roleName = user.role?.name || 'unknown';
    acc[roleName] = (acc[roleName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              <Icon name="users" size="lg" className="inline mr-2" />
              Управление пользователями
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Управляйте учетными записями и правами доступа. 
              {selectedSiteId ? ` Показано: ${filteredUsers.length}` : ` Всего пользователей: ${users.length}`}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => navigate('/users/create')}
            >
              <Icon name="userAdd" size="sm" className="mr-2" />
              Добавить пользователя
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фильтр по сайту
            </label>
            <SiteFilter
              selectedSiteId={selectedSiteId}
              onSiteChange={setSelectedSiteId}
              placeholder="Все сайты"
            />
          </div>
          
          {selectedSiteId && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Icon name="filter" size="sm" className="mr-1" />
              <span>Фильтр активен</span>
              <button
                onClick={() => setSelectedSiteId(null)}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>

        {/* Auth Warning */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="warning" size="lg" color="warning" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Не авторизован</h3>
                <div className="mt-1 text-sm text-yellow-700">
                  Вы не авторизованы в системе. Пожалуйста, войдите в систему для просмотра пользователей.
                </div>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    <Icon name="lock" size="sm" className="mr-2" />
                    Войти в систему
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="alert" size="lg" color="danger" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка загрузки</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchUsers()}
                  >
                    <Icon name="refresh" size="sm" className="mr-2" />
                    Попробовать снова
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {filteredUsers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Всего пользователей"
              value={filteredUsers.length}
              icon={<Icon name="users" size="lg" />}
              color="blue"
            />
            <StatsCard
              title="Активные"
              value={activeUsers.length}
              icon={<Icon name="check" size="lg" />}
              color="green"
              change={{
                value: `${Math.round((activeUsers.length / filteredUsers.length) * 100)}%`,
                type: 'neutral'
              }}
            />
            <StatsCard
              title="Неактивные"
              value={inactiveUsers.length}
              icon={<Icon name="cancel" size="lg" />}
              color="yellow"
              change={{
                value: `${Math.round((inactiveUsers.length / filteredUsers.length) * 100)}%`,
                type: 'neutral'
              }}
            />
            <StatsCard
              title="Администраторы"
              value={roleStats.admin || 0}
              icon={<Icon name="star" size="lg" />}
              color="purple"
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && !users.length ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка пользователей...</p>
            </div>
          </div>
        ) : (
          /* Users Table or Empty State */
          filteredUsers.length > 0 ? (
            <UsersTable siteId={selectedSiteId || undefined} />
          ) : !isLoading && !error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Icon name="user" size="2xl" className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedSiteId ? 'Нет пользователей для выбранного сайта' : 'Пользователи не найдены'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedSiteId 
                    ? 'Попробуйте выбрать другой сайт или создайте нового пользователя'
                    : 'Пока нет зарегистрированных пользователей в системе'
                  }
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/users/create')}
                >
                  <Icon name="userAdd" size="sm" className="mr-2" />
                  Создать пользователя
                </Button>
              </div>
            </div>
          ) : null
        )}
      </div>
    </DashboardLayout>
  );
};

export default Users; 
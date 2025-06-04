import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import UsersTable from '../components/tables/UsersTable';
import Button from '../components/ui/Button';
import { useUsersStore, useAuthStore } from '../store';

/**
 * Страница управления пользователями
 */
const Users: React.FC = () => {
  const navigate = useNavigate();
  const { fetchUsers, users, isLoading, error } = useUsersStore();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  // Загружаем пользователей при монтировании
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👥 Управление пользователями</h1>
            <p className="mt-2 text-sm text-gray-700">
              Управляйте учетными записями и правами доступа. Всего пользователей: {users.length}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => navigate('/users/create')}
            >
              ✨ Добавить пользователя
            </Button>
          </div>
        </div>

        {/* Auth Warning */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
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
                    🔑 Войти в систему
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
                <span className="text-red-400 text-xl">⚠️</span>
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
                    🔄 Попробовать снова
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !users.length ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка пользователей...</p>
            </div>
          </div>
        ) : (
          /* Users Table or Empty State */
          users.length > 0 ? (
            <UsersTable />
          ) : !isLoading && !error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Пользователи не найдены</h3>
                <p className="text-gray-600 mb-6">
                  Пока нет зарегистрированных пользователей в системе
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/users/create')}
                >
                  ✨ Создать первого пользователя
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
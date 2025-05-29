import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/axios.config';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: {
    id: number;
    name: string;
    display_name: string;
  };
  parent_user?: number;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Страница управления пользователями
 */
const Users: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{results?: User[], count?: number}>('/auth/users/');
      setUsers(Array.isArray(data) ? data : (data.results || []));
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      setError(apiError.message || 'Ошибка загрузки пользователей');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      await api.delete(`/auth/users/${userId}/`);
      setUsers(users.filter(user => user.id !== userId));
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      alert(apiError.message || 'Ошибка удаления пользователя');
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.post(`/auth/users/${userId}/toggle_active/`);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      alert(apiError.message || 'Ошибка изменения статуса пользователя');
    }
  };

  const resetUserPassword = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите сбросить пароль этого пользователя?')) {
      return;
    }

    try {
      const response = await api.post<{new_password: string}>(`/auth/users/${userId}/reset_password/`);
      alert(`Новый пароль: ${response.new_password}`);
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      alert(apiError.message || 'Ошибка сброса пароля');
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'superuser':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'author':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
            <p className="mt-1 text-sm text-gray-600">
              Создавайте и управляйте пользователями системы
            </p>
          </div>
          {currentUser?.role?.name === 'superuser' && (
            <Button variant="primary">
              + Создать пользователя
            </Button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users table */}
        <Card>
          <div className="overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Все пользователи ({users.length})
              </h3>
              
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">👥</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Нет пользователей
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Создайте первого пользователя для начала работы
                  </p>
                  {currentUser?.role?.name === 'superuser' && (
                    <Button variant="primary">
                      Создать первого пользователя
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Пользователь
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Роль
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Регистрация
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {user.avatar ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={user.avatar}
                                    alt={user.username}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-primary-600 font-medium">
                                      {(user.first_name || user.username).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.username
                                  }
                                </div>
                                <div className="text-sm text-gray-500">
                                  @{user.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role.name)}`}
                            >
                              {user.role.display_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.is_active ? 'Активен' : 'Заблокирован'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            {user.id !== currentUser?.id && (
                              <>
                                <button
                                  onClick={() => toggleUserStatus(user.id, user.is_active)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  {user.is_active ? 'Заблокировать' : 'Разблокировать'}
                                </button>
                                <button
                                  onClick={() => resetUserPassword(user.id)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Сбросить пароль
                                </button>
                                <button className="text-indigo-600 hover:text-indigo-900">
                                  Редактировать
                                </button>
                                {currentUser?.role?.name === 'superuser' && (
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Удалить
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        {users.length > 0 && (
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Статистика пользователей
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {users.length}
                  </div>
                  <div className="text-sm text-gray-600">Всего</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {users.filter(user => user.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Активных</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {users.filter(user => user.role.name === 'admin').length}
                  </div>
                  <div className="text-sm text-gray-600">Администраторы</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {users.filter(user => user.role.name === 'author').length}
                  </div>
                  <div className="text-sm text-gray-600">Авторы</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Users; 
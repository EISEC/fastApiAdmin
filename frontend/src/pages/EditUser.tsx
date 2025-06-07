import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import UserForm from '../components/forms/UserForm';
import Icon from '../components/ui/Icon';
import { useUsersStore } from '../store';
import type { User } from '../types';

/**
 * Страница редактирования пользователя
 */
const EditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Используем селекторы вместо деструктуризации
  const isLoading = useUsersStore(state => state.isLoading);
  const error = useUsersStore(state => state.error);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Упрощаем useEffect без useCallback
  useEffect(() => {
    const loadUser = async () => {
      if (!id) {
        navigate('/users');
        return;
      }

      try {
        setLoading(true);
        // Вызываем функцию напрямую из store
        await useUsersStore.getState().fetchUser(parseInt(id));
        // Получаем пользователя из store после загрузки
        const usersStore = useUsersStore.getState();
        setUser(usersStore.currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]); // Только id в зависимостях

  const handleSuccess = () => {
    navigate('/users');
  };

  const handleCancel = () => {
    navigate('/users');
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка пользователя...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="warning" size="lg" color="danger" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Ошибка</h3>
                <div className="mt-2 text-red-700">
                  {error || 'Пользователь не найден'}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/users')}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Вернуться к списку пользователей
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <button
            onClick={() => navigate('/users')}
            className="hover:text-gray-700 transition-colors"
          >
            <Icon name="users" size="md" className="mr-2" />
            Пользователи
          </button>
                        <Icon name="arrowRight" size="sm" />
          <span className="text-gray-900 font-medium">
            <Icon name="edit" size="md" className="mr-2" />
            Редактирование пользователя
          </span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Icon name="edit" size="lg" className="mr-2" />
                Редактирование пользователя
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Обновите информацию о пользователе {user.username}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.username} avatar`}
                  className="h-16 w-16 rounded-xl object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-white font-bold text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <UserForm
          user={user}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default EditUser; 
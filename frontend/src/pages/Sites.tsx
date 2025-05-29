import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuthStore, useSitesStore } from '../store';

/**
 * Страница управления сайтами
 */
const Sites: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { 
    sites, 
    isLoading, 
    error, 
    fetchSites, 
    deleteSite, 
    toggleActive,
    clearError 
  } = useSitesStore();

  // Загружаем сайты при монтировании компонента
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Обработка ошибок
  useEffect(() => {
    if (error) {
      // Ошибка будет показана в UI, очищаем через некоторое время
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleDeleteSite = async (siteId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот сайт?')) {
      return;
    }

    try {
      await deleteSite(siteId);
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const handleToggleSiteStatus = async (siteId: number) => {
    try {
      await toggleActive(siteId);
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const handleCreateSite = () => {
    navigate('/sites/create');
  };

  const handleEditSite = (siteId: number) => {
    navigate(`/sites/${siteId}/edit`);
  };

  if (isLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Управление сайтами</h1>
            <p className="mt-1 text-sm text-gray-600">
              Создавайте и управляйте вашими сайтами
            </p>
          </div>
          <Button variant="primary" onClick={handleCreateSite}>
            + Создать сайт
          </Button>
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

        {/* Sites table */}
        <Card>
          <div className="overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Все сайты ({sites.length})
              </h3>
              
              {sites.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">🌐</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Нет сайтов
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Создайте свой первый сайт, чтобы начать работу
                  </p>
                  <Button variant="primary" onClick={handleCreateSite}>
                    Создать первый сайт
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Сайт
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Домен
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Владелец
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Создан
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sites.map((site) => (
                        <tr key={site.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {site.logo ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={site.logo}
                                    alt={site.name}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-primary-600 font-medium">
                                      {site.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {site.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {site.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{site.domain}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                site.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {site.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {site.owner_name || `ID: ${site.owner}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(site.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleToggleSiteStatus(site.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={isLoading}
                            >
                              {site.is_active ? 'Деактивировать' : 'Активировать'}
                            </button>
                            <button 
                              onClick={() => handleEditSite(site.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Редактировать
                            </button>
                            {user?.role?.name === 'superuser' && (
                              <button
                                onClick={() => handleDeleteSite(site.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={isLoading}
                              >
                                Удалить
                              </button>
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
      </div>
    </DashboardLayout>
  );
};

export default Sites; 
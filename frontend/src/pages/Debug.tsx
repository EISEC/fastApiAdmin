import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useGlobalSettings } from '../store/globalSettingsStore';
import { useSitesStore } from '../store/sitesStore';
import { usePostsStore } from '../store/postsStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import Icon from '../components/ui/Icon';

/**
 * Диагностическая страница для проверки состояния всех store
 */
const Debug: React.FC = () => {
  const authStore = useAuthStore();
  const globalSettings = useGlobalSettings();
  const sitesStore = useSitesStore();
  const postsStore = usePostsStore();

  const diagnostics = [
    {
      name: 'Auth Store',
      status: authStore.isAuthenticated ? 'OK' : 'Not authenticated',
      loading: authStore.isLoading,
      error: authStore.error,
      data: {
        user: authStore.user?.email || 'null',
        isAuthenticated: authStore.isAuthenticated,
      }
    },
    {
      name: 'Global Settings',
      status: globalSettings.settingsLoaded ? 'OK' : 'Not loaded',
      loading: globalSettings.isSettingsLoading,
      error: globalSettings.settingsError,
      data: {
        settingsCount: Object.keys(globalSettings.settings).length,
        socialNetworksCount: globalSettings.socialNetworks.length,
        settingsLoaded: globalSettings.settingsLoaded,
        socialLoaded: globalSettings.socialLoaded,
      }
    },
    {
      name: 'Sites Store',
      status: sitesStore.sites.length > 0 ? 'OK' : 'No sites',
      loading: sitesStore.isLoading,
      error: sitesStore.error,
      data: {
        sitesCount: sitesStore.sites.length,
        loaded: sitesStore.sites.length > 0 || sitesStore.error !== null,
      }
    },
    {
      name: 'Posts Store',
      status: 'Not checked',
      loading: postsStore.isLoading,
      error: postsStore.error,
      data: {
        postsCount: postsStore.posts.length,
        loaded: postsStore.posts.length > 0 || postsStore.error !== null,
      }
    }
  ];

  return (
    <DashboardLayout title="Диагностика">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Icon name="settings" className="text-blue-600" size="lg" />
          <h1 className="text-2xl font-bold text-gray-900">Диагностика системы</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {diagnostics.map((item) => (
            <div
              key={item.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                <div className="flex items-center space-x-2">
                  {item.loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.error
                        ? 'bg-red-100 text-red-800'
                        : item.status === 'OK'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.error ? 'Ошибка' : item.status}
                  </span>
                </div>
              </div>

              {item.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{item.error}</p>
                </div>
              )}

              <div className="space-y-2">
                {Object.entries(item.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium text-gray-900">
                      {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Icon name="info" className="text-blue-600 mt-0.5" size="md" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Информация</h4>
              <p className="text-sm text-blue-800 mt-1">
                Эта страница показывает состояние всех основных store приложения. 
                Если какой-то store показывает ошибку или застрял в состоянии загрузки, 
                это может указывать на проблему с API или бесконечные циклы.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Быстрые действия</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => globalSettings.loadAll()}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon name="refresh" size="sm" className="mr-2" />
              Перезагрузить настройки
            </button>
            
            <button
              onClick={() => sitesStore.fetchSites()}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Icon name="refresh" size="sm" className="mr-2" />
              Перезагрузить сайты
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Icon name="refresh" size="sm" className="mr-2" />
              Перезагрузить страницу
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Icon name="logout" size="sm" className="mr-2" />
              Очистить и выйти
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Debug; 
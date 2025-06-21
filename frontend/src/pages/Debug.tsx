import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGlobalSettings } from '../store/globalSettingsStore';
import { useSitesStore } from '../store/sitesStore';
import { usePostsStore } from '../store/postsStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import Icon from '../components/ui/Icon';
import apiClient from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { api } from '../lib/axios.config';
import Input from '../components/ui/Input';

/**
 * Диагностическая страница для проверки состояния всех store
 */
const Debug: React.FC = () => {
  const authStore = useAuthStore();
  const globalSettings = useGlobalSettings();
  const sitesStore = useSitesStore();
  const postsStore = usePostsStore();
  const [corsStatus, setCorsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [corsResult, setCorsResult] = useState<string>('');
  const [apiResult, setApiResult] = useState<string>('');
  const [authResult, setAuthResult] = useState<string>('');
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpass123');

  const testCors = async () => {
    setCorsStatus('loading');
    setCorsResult('');
    
    try {
      console.log('🔍 Начинаю тест CORS...');
      
      // Простой GET запрос для проверки CORS
      const response = await fetch('http://localhost:8000/test/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        credentials: 'include', // Включаем cookies
      });
      
      console.log('📡 CORS ответ:', response);
      console.log('📡 CORS headers:', [...response.headers.entries()]);
      
      if (response.ok) {
        const text = await response.text();
        setCorsResult(`✅ CORS работает! Ответ: ${text}`);
        setCorsStatus('success');
        console.log('✅ CORS успешно:', text);
      } else {
        setCorsResult(`❌ Ошибка: ${response.status} - ${response.statusText}`);
        setCorsStatus('error');
        console.error('❌ CORS ошибка статуса:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ CORS исключение:', error);
      setCorsResult(`❌ CORS ошибка: ${error}`);
      setCorsStatus('error');
    }
  };

  const testApi = async () => {
    setApiStatus('loading');
    setApiResult('');
    
    try {
      console.log('🔍 Начинаю тест API...');
      
      // Запрос к API без авторизации (должен вернуть 401)
      const response = await apiClient.get('/sites/');
      console.log('📡 API ответ:', response);
      
      setApiResult(`✅ API ответил: ${JSON.stringify(response)}`);
      setApiStatus('success');
    } catch (error: any) {
      console.error('❌ API ошибка:', error);
      console.error('❌ API error.response:', error.response);
      console.error('❌ API error.message:', error.message);
      
      if (error.response?.status === 401) {
        setApiResult(`✅ API работает! Требует авторизации (401)`);
        setApiStatus('success');
        console.log('✅ API корректно требует авторизацию');
      } else if (error.message.includes('CORS')) {
        setApiResult(`❌ CORS ошибка в API: ${error.message}`);
        setApiStatus('error');
      } else {
        setApiResult(`❌ API ошибка: ${error.message}`);
        setApiStatus('error');
      }
    }
  };

  const testAuth = async () => {
    setAuthStatus('loading');
    setAuthResult('');
    
    try {

      
      // Тестируем авторизацию через api из axios.config
      const response = await api.post('/auth/token/', {
        email: testEmail,
        password: testPassword,
      });
      
      setAuthResult(`✅ Авторизация успешна! Токен получен: ${(response as any).access?.substring(0, 20)}...`);
      setAuthStatus('success');
      
    } catch (error: any) {
      
      if (error.message && error.message.includes('CORS')) {
        setAuthResult(`❌ CORS ошибка при авторизации: ${error.message}`);
        setAuthStatus('error');
      } else if (error.response?.status === 400) {
        setAuthResult(`❌ Неверные credentials (400): ${error.response.data?.detail || 'Неверный email или пароль'}`);
        setAuthStatus('error');
      } else if (error.code === 'ERR_NETWORK') {
        setAuthResult(`❌ Сетевая ошибка (возможно CORS): ${error.message}`);
        setAuthStatus('error');
      } else {
        setAuthResult(`❌ Auth ошибка: ${error.message}`);
        setAuthStatus('error');
      }
    }
  };

  const testAxiosDirectly = async () => {
    try {
      console.log('🔍 Прямой тест axios...');
      
      const response = await fetch('http://localhost:8000/api/v1/sites/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        credentials: 'include',
      });
      
      console.log('📡 Прямой fetch ответ:', response);
      console.log('📡 Прямой fetch статус:', response.status);
      console.log('📡 Прямой fetch headers:', [...response.headers.entries()]);
      
      const data = await response.json();
      console.log('📡 Прямой fetch данные:', data);
      
    } catch (error) {
      console.error('❌ Прямой fetch ошибка:', error);
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CORS Test */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Icon name="globe" className="mr-2" />
                Тест CORS
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Проверяет базовое CORS соединение с backend
              </p>
              
              <Button
                onClick={testCors}
                disabled={corsStatus === 'loading'}
                className="mb-4 w-full"
                variant="primary"
              >
                <Icon name={corsStatus === 'loading' ? 'refresh' : 'play'} className="mr-2" />
                {corsStatus === 'loading' ? 'Проверяю...' : 'Проверить CORS'}
              </Button>

              {corsResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  corsStatus === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {corsResult}
                </div>
              )}
            </div>
          </Card>

          {/* API Test */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Icon name="database" className="mr-2" />
                Тест API
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Проверяет API endpoints через настроенный клиент
              </p>
              
              <Button
                onClick={testApi}
                disabled={apiStatus === 'loading'}
                className="mb-4 w-full"
                variant="secondary"
              >
                <Icon name={apiStatus === 'loading' ? 'refresh' : 'database'} className="mr-2" />
                {apiStatus === 'loading' ? 'Проверяю...' : 'Проверить API'}
              </Button>

              {apiResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  apiStatus === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {apiResult}
                </div>
              )}
            </div>
          </Card>

          {/* Auth Test */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Icon name="lock" className="mr-2" />
                Тест авторизации
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Проверяет авторизацию через /auth/token/ endpoint
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <Input
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="password"
                  />
                </div>
              </div>
              
              <Button
                onClick={testAuth}
                disabled={authStatus === 'loading'}
                className="mb-4 w-full"
                variant="danger"
              >
                <Icon name={authStatus === 'loading' ? 'refresh' : 'login'} className="mr-2" />
                {authStatus === 'loading' ? 'Проверяю...' : 'Тест авторизации'}
              </Button>

              {authResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  authStatus === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {authResult}
                </div>
              )}
            </div>
          </Card>

          {/* Direct Test */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Icon name="code" className="mr-2" />
                Прямой тест
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Прямой fetch запрос к API
              </p>
              
              <Button
                onClick={testAxiosDirectly}
                className="mb-4 w-full"
                variant="secondary"
              >
                <Icon name="play" className="mr-2" />
                Прямой fetch
              </Button>

              <div className="text-xs text-gray-500">
                Смотрите результат в консоли браузера (F12)
              </div>
            </div>
          </Card>
        </div>

        {/* Connection Info */}
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Icon name="info" className="mr-2" />
              Информация о соединении
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Frontend URL:</p>
                <p className="text-gray-600 font-mono">http://localhost:5173</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Backend URL:</p>
                <p className="text-gray-600 font-mono">http://localhost:8000</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">API Base URL:</p>
                <p className="text-gray-600 font-mono">http://localhost:8000/api/v1</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Database:</p>
                <p className="text-gray-600">MySQL (Production)</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">💡 Советы по отладке CORS:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Откройте консоль браузера (F12) для детальных логов</li>
                <li>• Проверьте вкладку Network для HTTP запросов</li>
                <li>• CORS ошибки обычно видны в консоли как красный текст</li>
                <li>• Preflight запросы (OPTIONS) должны возвращать 200</li>
                <li>• При авторизации проверьте что credentials включены</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Debug; 
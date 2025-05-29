import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';

/**
 * Главная страница дашборда
 */
const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  
  const stats = [
    {
      name: 'Всего сайтов',
      value: '12',
      icon: '🌐',
      change: '+2 за неделю',
      changeType: 'positive',
    },
    {
      name: 'Активных постов',
      value: '245',
      icon: '📝',
      change: '+12 за неделю',
      changeType: 'positive',
    },
    {
      name: 'Страниц',
      value: '89',
      icon: '📄',
      change: '+5 за неделю',
      changeType: 'positive',
    },
    {
      name: 'Пользователей',
      value: '8',
      icon: '👥',
      change: '+1 за неделю',
      changeType: 'positive',
    },
  ];
  
  const recentActivity = [
    {
      id: 1,
      action: 'Создан новый пост',
      details: '"10 способов улучшить SEO"',
      user: 'Иван Петров',
      time: '2 часа назад',
    },
    {
      id: 2,
      action: 'Обновлена страница',
      details: 'Главная страница сайта example.com',
      user: 'Мария Сидорова',
      time: '4 часа назад',
    },
    {
      id: 3,
      action: 'Добавлен новый сайт',
      details: 'blog.example.com',
      user: 'Алексей Иванов',
      time: '1 день назад',
    },
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Добро пожаловать, {user?.first_name || user?.username}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Обзор вашей системы управления контентом
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} hover>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">{stat.icon}</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Feed */}
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Последняя активность
              </h3>
            </div>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivity.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                            <svg
                              className="h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.23 10.661a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">
                                {activity.action}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {activity.details}
                            </p>
                            <div className="mt-2 text-xs text-gray-400">
                              {activity.user} • {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Быстрые действия
              </h3>
            </div>
            <div className="space-y-3">
              <Link
                to="/posts"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="text-xl">📝</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Управление постами
                  </p>
                  <p className="text-sm text-gray-500">
                    Создавать и редактировать посты
                  </p>
                </div>
              </Link>
              
              <Link
                to="/pages"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="text-xl">📄</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Управление страницами
                  </p>
                  <p className="text-sm text-gray-500">
                    Создавать и редактировать страницы
                  </p>
                </div>
              </Link>
              
              <Link
                to="/sites"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="text-xl">🌐</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Управление сайтами
                  </p>
                  <p className="text-sm text-gray-500">
                    Создавать и настраивать сайты
                  </p>
                </div>
              </Link>
              
              {(user?.role?.name === 'superuser' || user?.role?.name === 'admin') && (
                <Link
                  to="/users"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <span className="text-xl">👥</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Управление пользователями
                    </p>
                    <p className="text-sm text-gray-500">
                      Создавать и управлять пользователями
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard; 
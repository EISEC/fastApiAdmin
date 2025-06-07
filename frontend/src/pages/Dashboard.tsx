import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/ui/StatsCard';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { useSitesStore } from '../store/sitesStore';
import { usePostsStore } from '../store/postsStore';
import { useUsersStore } from '../store/usersStore';
import { useSettings } from '../hooks/useSettings';

/**
 * Главная страница дашборда с общей статистикой
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getSetting, isLoading: settingsLoading } = useSettings();
  
  const { sites, fetchSites } = useSitesStore();
  const { posts, fetchPosts } = usePostsStore();
  const { users, fetchUsers } = useUsersStore();

  useEffect(() => {
    // Загружаем данные для статистики
    fetchSites();
    fetchPosts();
    fetchUsers();
  }, [fetchSites, fetchPosts, fetchUsers]);

  // Вычисляем статистику
  const sitesStats = {
    total: sites.length,
    active: sites.filter(site => site.is_active).length,
  };

  const postsStats = {
    total: posts.length,
    published: posts.filter(post => post.status === 'published').length,
    views: posts.reduce((sum, post) => sum + (post.views_count || 0), 0),
  };

  const usersStats = {
    total: users.length,
    active: users.filter(user => user.is_active).length,
  };

  // Получаем значения из настроек
  const welcomeMessage = getSetting('welcome_message', 'Добро пожаловать в панель управления!');
  const dashboardDescription = getSetting('dashboard_description', 'Обзор системы управления сайтами');

  return (
    <DashboardLayout title="Главная">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
          <p className="mt-2 text-sm text-gray-700">
            {settingsLoading ? 'Загрузка...' : dashboardDescription}
          </p>
          {welcomeMessage && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{welcomeMessage}</p>
            </div>
          )}
        </div>

        {/* Test Connection Component */}
        {/* TestConnection /> */}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Всего сайтов"
            value={sitesStats.total}
            change={{ value: `+${sitesStats.active} активных`, type: 'increase' }}
            color="blue"
            icon={<Icon name="globe" size="lg" />}
          />
          
          <StatsCard
            title="Всего постов"
            value={postsStats.total}
            change={{ value: `${postsStats.published} опубликованных`, type: 'increase' }}
            color="green"
            icon={<Icon name="edit" size="lg" />}
          />
          
          <StatsCard
            title="Пользователи"
            value={usersStats.total}
            change={{ value: `${usersStats.active} активных`, type: 'increase' }}
            color="purple"
            icon={<Icon name="users" size="lg" />}
          />
          
          <StatsCard
            title="Просмотры"
            value={postsStats.views.toLocaleString()}
            change={{ value: '+12%', type: 'increase' }}
            color="yellow"
            icon={<Icon name="eye" size="lg" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="primary"
              onClick={() => navigate('/sites/create')}
              className="justify-center"
            >
              <Icon name="globe" size="sm" className="mr-2" />
              Создать сайт
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/posts/create')}
              className="justify-center"
            >
              <Icon name="edit" size="sm" className="mr-2" />
              Написать пост
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/users/create')}
              className="justify-center"
            >
              <Icon name="user" size="sm" className="mr-2" />
              Добавить пользователя
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/pages/create')}
              className="justify-center"
            >
              <Icon name="file" size="sm" className="mr-2" />
              Создать страницу
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sites */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Последние сайты</h2>
              <Button variant="secondary" size="sm" onClick={() => navigate('/sites')}>
                Все сайты
              </Button>
            </div>
            
            {sites.slice(0, 3).length > 0 ? (
              <div className="space-y-3">
                {sites.slice(0, 3).map((site) => (
                  <div key={site.id} className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                      {site.logo ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={site.logo}
                          alt={site.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {site.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{site.name}</p>
                      <p className="text-sm text-gray-500 truncate">{site.domain}</p>
                    </div>
                    <div className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      site.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {site.is_active ? 'Активен' : 'Неактивен'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="globe" size="2xl" className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Нет созданных сайтов</p>
              </div>
            )}
          </div>

          {/* Recent Posts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Последние посты</h2>
              <Button variant="secondary" size="sm" onClick={() => navigate('/posts')}>
                Все посты
              </Button>
            </div>
            
            {posts.slice(0, 3).length > 0 ? (
              <div className="space-y-3">
                {posts.slice(0, 3).map((post) => (
                  <div key={post.id} className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                      {post.featured_image ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={post.featured_image}
                          alt={post.title}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                          <Icon name="file" color="white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                      <p className="text-sm text-gray-500 truncate">{post.author_name}</p>
                    </div>
                    <div className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' :
                      post.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status === 'published' ? 'Опубликован' :
                       post.status === 'draft' ? 'Черновик' :
                       post.status === 'scheduled' ? 'Запланирован' : 'Архивирован'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="edit" size="2xl" className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Нет созданных постов</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard; 
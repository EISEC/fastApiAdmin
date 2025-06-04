import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/ui/StatsCard';
import Button from '../components/ui/Button';
import { useSitesStore, usePostsStore, useUsersStore } from '../store';

/**
 * Главная страница дашборда с общей статистикой
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
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
    drafts: posts.filter(post => post.status === 'draft').length,
    views: posts.reduce((sum, post) => sum + (post.views_count || 0), 0),
  };

  const usersStats = {
    total: users.length,
    active: users.filter(user => user.is_active).length,
    admins: users.filter(user => user.role?.name === 'admin').length,
    authors: users.filter(user => user.role?.name === 'author').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать в панель управления! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Управляйте вашими сайтами, контентом и пользователями из единого места.
          </p>
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
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            }
          />
          
          <StatsCard
            title="Всего постов"
            value={postsStats.total}
            change={{ value: `${postsStats.published} опубликованных`, type: 'increase' }}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          
          <StatsCard
            title="Пользователи"
            value={usersStats.total}
            change={{ value: `${usersStats.active} активных`, type: 'increase' }}
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
          />
          
          <StatsCard
            title="Просмотры"
            value={postsStats.views.toLocaleString()}
            change={{ value: '+12%', type: 'increase' }}
            color="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
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
              <span className="mr-2">🌐</span>
              Создать сайт
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/posts/create')}
              className="justify-center"
            >
              <span className="mr-2">📝</span>
              Написать пост
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/users/create')}
              className="justify-center"
            >
              <span className="mr-2">👤</span>
              Добавить пользователя
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/pages/create')}
              className="justify-center"
            >
              <span className="mr-2">📄</span>
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
                <div className="text-4xl mb-3">🌐</div>
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
                          <span className="text-white text-lg">📄</span>
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
                <div className="text-4xl mb-3">📝</div>
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
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PostsTable from '../components/tables/PostsTable';
import StatsCard from '../components/ui/StatsCard';
import SiteFilter from '../components/ui/SiteFilter';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { usePostsStore, useSitesStore } from '../store';

/**
 * Страница управления постами
 */
const Posts: React.FC = () => {
  const navigate = useNavigate();
  const { fetchPosts, posts, isLoading } = usePostsStore();
  const { sites } = useSitesStore();
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);

  // Загружаем посты при монтировании
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Фильтрация постов по сайту
  const filteredPosts = selectedSiteId 
    ? posts.filter(post => {
        // Находим название сайта по ID
        const selectedSite = sites.find(site => site.id === selectedSiteId);
        return selectedSite && post.site_name === selectedSite.name;
      })
    : posts;

  // Вычисление статистики для отфильтрованных данных
  const publishedPosts = filteredPosts.filter(post => post.status === 'published');
  const draftPosts = filteredPosts.filter(post => post.status === 'draft');
  const scheduledPosts = filteredPosts.filter(post => post.status === 'scheduled');
  const totalViews = filteredPosts.reduce((sum, post) => sum + (post.views_count || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление постами</h1>
            <p className="mt-2 text-sm text-gray-700">
              Создавайте и управляйте контентом ваших сайтов. 
              {selectedSiteId ? ` Показано: ${filteredPosts.length}` : ` Всего постов: ${posts.length}`}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => navigate('/posts/create')}
            >
              <Icon name="add" size="sm" className="mr-2" />
              Создать пост
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

        {/* Statistics Cards */}
        {filteredPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Всего постов"
              value={filteredPosts.length}
              icon={<Icon name="edit" size="lg" />}
              color="blue"
            />
            <StatsCard
              title="Опубликовано"
              value={publishedPosts.length}
              icon={<Icon name="check" size="lg" />}
              color="green"
              change={{
                value: `${Math.round((publishedPosts.length / filteredPosts.length) * 100)}%`,
                type: 'neutral'
              }}
            />
            <StatsCard
              title="Черновики"
              value={draftPosts.length}
              icon={<Icon name="file" size="lg" />}
              color="yellow"
              change={{
                value: `${Math.round((draftPosts.length / filteredPosts.length) * 100)}%`,
                type: 'neutral'
              }}
            />
            <StatsCard
              title="Просмотры"
              value={totalViews.toLocaleString()}
              icon={<Icon name="eye" size="lg" />}
              color="purple"
            />
          </div>
        )}

        {/* Empty State */}
        {filteredPosts.length === 0 && !isLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <Icon name="edit" size="2xl" className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedSiteId ? 'Нет постов для выбранного сайта' : 'Нет постов'}
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedSiteId 
                  ? 'Попробуйте выбрать другой сайт или создайте новый пост'
                  : 'Создайте первый пост для вашего сайта'
                }
              </p>
              <Button 
                variant="primary" 
                onClick={() => navigate('/posts/create')}
              >
                <Icon name="edit" size="sm" className="mr-2" />
                Создать пост
              </Button>
            </div>
          </div>
        )}

        {/* Posts Table */}
        {filteredPosts.length > 0 && (
          <PostsTable siteId={selectedSiteId || undefined} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Posts; 
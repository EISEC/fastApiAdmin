import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PagesTable from '../components/tables/PagesTable';
import StatsCard from '../components/ui/StatsCard';
import SiteFilter from '../components/ui/SiteFilter';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { usePagesStore, useSitesStore } from '../store';

/**
 * Страница управления страницами
 */
const Pages: React.FC = () => {
  const navigate = useNavigate();
  const { 
    pages, 
    isLoading, 
    error, 
    fetchPages, 
    clearError 
  } = usePagesStore();
  const { sites } = useSitesStore();

  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);

  // Загружаем страницы при монтировании компонента
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

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

  const handleCreatePage = () => {
    navigate('/pages/create');
  };

  // Фильтрация страниц по сайту
  const filteredPages = selectedSiteId 
    ? pages.filter(page => {
        // Находим название сайта по ID
        const selectedSite = sites.find(site => site.id === selectedSiteId);
        return selectedSite && page.site_name === selectedSite.name;
      })
    : pages;

  // Вычисление статистики для отфильтрованных данных
  const publishedPages = filteredPages.filter(page => page.status === 'published');
  const draftPages = filteredPages.filter(page => page.status === 'draft');
  const homepages = filteredPages.filter(page => page.is_homepage);
  const totalViews = filteredPages.reduce((sum, page) => sum + (page.views_count || 0), 0);

  if (isLoading && pages.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление страницами</h1>
            <p className="mt-2 text-sm text-gray-700">
              Создавайте и редактируйте страницы для ваших сайтов. 
              {selectedSiteId ? ` Показано: ${filteredPages.length}` : ` Всего страниц: ${pages.length}`}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex sm:space-x-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/pages/create-with-builder')}
              size="sm"
            >
              <Icon name="code" size="sm" className="mr-2" />
              Конструктор страниц
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePage}
            >
              <Icon name="add" size="sm" className="mr-2" />
              Создать страницу
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

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="alert" size="lg" color="danger" />
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

        {/* Statistics Cards */}
        {filteredPages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Всего страниц"
              value={filteredPages.length}
              icon={<Icon name="file" size="lg" />}
              color="blue"
            />
            <StatsCard
              title="Опубликовано"
              value={publishedPages.length}
              icon={<Icon name="check" size="lg" />}
              color="green"
              change={{
                value: `${Math.round((publishedPages.length / filteredPages.length) * 100)}%`,
                type: 'neutral'
              }}
            />
            <StatsCard
              title="Черновики"
              value={draftPages.length}
              icon={<Icon name="edit" size="lg" />}
              color="yellow"
              change={{
                value: `${Math.round((draftPages.length / filteredPages.length) * 100)}%`,
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
        {filteredPages.length === 0 && !isLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <Icon name="file" size="2xl" className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedSiteId ? 'Нет страниц для выбранного сайта' : 'Нет страниц'}
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedSiteId 
                  ? 'Попробуйте выбрать другой сайт или создайте новую страницу'
                  : 'Создайте первую страницу для вашего сайта'
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="primary" 
                  onClick={handleCreatePage}
                >
                  <Icon name="edit" size="sm" className="mr-2" />
                  Создать страницу
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/pages/create-with-builder')}
                >
                  <Icon name="code" size="sm" className="mr-2" />
                  Конструктор страниц
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pages Table */}
        {filteredPages.length > 0 && (
          <PagesTable siteId={selectedSiteId || undefined} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pages; 
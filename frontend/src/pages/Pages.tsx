import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuthStore, usePagesStore } from '../store';
import type { PageStatus } from '../types';

/**
 * Страница управления страницами
 */
const Pages: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { 
    pages, 
    isLoading, 
    error, 
    fetchPages, 
    deletePage, 
    changeStatus,
    setHomepage,
    clearError 
  } = usePagesStore();

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

  const handleDeletePage = async (pageId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту страницу?')) {
      return;
    }

    try {
      await deletePage(pageId);
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const togglePageStatus = async (pageId: number, currentStatus: PageStatus) => {
    const newStatus: PageStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await changeStatus(pageId, newStatus);
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const handleSetHomepage = async (pageId: number) => {
    try {
      await setHomepage(pageId);
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const handleCreatePage = () => {
    navigate('/pages/create');
  };

  const handleEditPage = (pageId: number) => {
    navigate(`/pages/${pageId}/edit`);
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
            <h1 className="text-2xl font-bold text-gray-900">Управление страницами</h1>
            <p className="mt-1 text-sm text-gray-600">
              Создавайте и редактируйте страницы для ваших сайтов
            </p>
          </div>
          <Button variant="primary" onClick={handleCreatePage}>
            + Создать страницу
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

        {pages.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📄</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет страниц
              </h3>
              <p className="text-gray-500 mb-4">
                Создайте первую страницу для вашего сайта
              </p>
              <Button variant="primary" onClick={handleCreatePage}>
                Создать первую страницу
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Все страницы ({pages.length})
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Название
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Сайт
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Тип
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Автор
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата создания
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-sm font-medium">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                page.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {page.status === 'published' ? 'Опубликована' : 'Черновик'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {page.is_homepage && (
                                <span className="mr-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  🏠 Главная
                                </span>
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {page.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {page.site_name || 'Без сайта'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {page.parent_title ? (
                              <span>Дочерняя страница</span>
                            ) : (
                              <span>Основная страница</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {page.author_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                            {new Date(page.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {!page.is_homepage && (
                                <button
                                  onClick={() => handleSetHomepage(page.id)}
                                  className="text-blue-600 hover:text-blue-900 text-xs"
                                  disabled={isLoading}
                                >
                                  Сделать главной
                                </button>
                              )}
                              <button
                                onClick={() => togglePageStatus(page.id, page.status)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs"
                                disabled={isLoading}
                              >
                                {page.status === 'published' ? 'Скрыть' : 'Опубликовать'}
                              </button>
                              <button 
                                onClick={() => handleEditPage(page.id)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs"
                              >
                                Редактировать
                              </button>
                              {(user?.role?.name === 'superuser' || user?.id) && (
                                <button
                                  onClick={() => handleDeletePage(page.id)}
                                  className="text-red-600 hover:text-red-900 text-xs"
                                  disabled={isLoading}
                                >
                                  Удалить
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        {pages.length > 0 && (
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Статистика страниц
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {pages.length}
                  </div>
                  <div className="text-sm text-gray-600">Всего страниц</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {pages.filter(page => page.status === 'published').length}
                  </div>
                  <div className="text-sm text-gray-600">Опубликовано</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {pages.filter(page => page.status === 'draft').length}
                  </div>
                  <div className="text-sm text-gray-600">Черновики</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {pages.filter(page => page.is_homepage).length}
                  </div>
                  <div className="text-sm text-gray-600">Главных страниц</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pages; 
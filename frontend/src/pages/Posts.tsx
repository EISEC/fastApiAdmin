import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuthStore, usePostsStore } from '../store';
import type { PostStatus } from '../types';

/**
 * Страница управления постами
 */
const Posts: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { 
    posts, 
    isLoading, 
    error, 
    fetchPosts, 
    deletePost, 
    changeStatus,
    clearError 
  } = usePostsStore();
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('grid');

  // Загружаем посты при монтировании компонента
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
      return;
    }

    try {
      await deletePost(postId);
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const togglePostStatus = async (postId: number, currentStatus: PostStatus) => {
    const newStatus: PostStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await changeStatus(postId, newStatus);
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const handleCreatePost = () => {
    navigate('/posts/create');
  };

  const handleEditPost = (postId: number) => {
    navigate(`/posts/${postId}/edit`);
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
            <h1 className="text-2xl font-bold text-gray-900">Управление постами</h1>
            <p className="mt-1 text-sm text-gray-600">
              Создавайте и редактируйте посты для ваших сайтов
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            >
              {viewMode === 'table' ? '📋 Таблица' : '📱 Сетка'}
            </Button>
            <Button variant="primary" onClick={handleCreatePost}>
              + Создать пост
            </Button>
          </div>
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

        {posts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📝</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет постов
              </h3>
              <p className="text-gray-500 mb-4">
                Создайте первый пост для вашего сайта
              </p>
              <Button variant="primary" onClick={handleCreatePost}>
                Создать первый пост
              </Button>
            </div>
          </Card>
        ) : viewMode === 'table' ? (
          <Card>
            <div className="overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Все посты ({posts.length})
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
                          Содержание
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
                      {posts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                post.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {post.status === 'published' ? 'Опубликован' : 'Черновик'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {post.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {post.excerpt || 'Нет описания'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {post.author_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => togglePostStatus(post.id, post.status)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs"
                                disabled={isLoading}
                              >
                                {post.status === 'published' ? 'Скрыть' : 'Опубликовать'}
                              </button>
                              <button 
                                onClick={() => handleEditPost(post.id)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs"
                              >
                                Редактировать
                              </button>
                              {(user?.role?.name === 'superuser' || user?.id) && (
                                <button
                                  onClick={() => handleDeletePost(post.id)}
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
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} hover>
                <div className="p-4">
                  {/* Post image */}
                  {post.featured_image && (
                    <div className="mb-4">
                      <img
                        className="w-full h-48 object-cover rounded-lg"
                        src={post.featured_image}
                        alt={post.title}
                      />
                    </div>
                  )}
                  
                  {/* Post content */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.status === 'published' ? 'Опубликован' : 'Черновик'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {post.site_name || 'Без сайта'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {post.excerpt || 'Нет описания'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {post.author_name}
                      </span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => togglePostStatus(post.id, post.status)}
                          className="text-xs text-indigo-600 hover:text-indigo-900"
                          disabled={isLoading}
                        >
                          {post.status === 'published' ? 'Скрыть' : 'Опубликовать'}
                        </button>
                        <button 
                          onClick={() => handleEditPost(post.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-900"
                        >
                          Редактировать
                        </button>
                      </div>
                      {(user?.role?.name === 'superuser' || user?.id) && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-xs text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {posts.length > 0 && (
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Статистика постов
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {posts.length}
                  </div>
                  <div className="text-sm text-gray-600">Всего постов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {posts.filter(post => post.status === 'published').length}
                  </div>
                  <div className="text-sm text-gray-600">Опубликовано</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {posts.filter(post => post.status === 'draft').length}
                  </div>
                  <div className="text-sm text-gray-600">Черновики</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Posts; 
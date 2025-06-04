import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PostsTable from '../components/tables/PostsTable';
import Button from '../components/ui/Button';
import { usePostsStore } from '../store';

/**
 * Страница управления постами
 */
const Posts: React.FC = () => {
  const navigate = useNavigate();
  const { fetchPosts, posts } = usePostsStore();

  // Загружаем посты при монтировании
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление постами</h1>
            <p className="mt-2 text-sm text-gray-700">
              Создавайте и управляйте контентом ваших сайтов. Всего постов: {posts.length}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => navigate('/posts/create')}
            >
              + Создать пост
            </Button>
          </div>
        </div>

        {/* Posts Table */}
        <PostsTable />
      </div>
    </DashboardLayout>
  );
};

export default Posts; 
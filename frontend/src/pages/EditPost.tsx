import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PostForm from '../components/forms/PostForm';
import { api } from '../lib/axios.config';

interface Post {
  id: number;
  title: string;
  content: string;
  slug: string;
  image?: string;
  is_published: boolean;
  site: number;
  site_name?: string;
  author: number;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Страница редактирования поста
 */
const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('ID поста не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await api.get<Post>(`/posts/${id}/`);
        setPost(data);
      } catch (error: unknown) {
        const apiError = error as { message?: string };
        setError(apiError.message || 'Ошибка загрузки поста');
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleSuccess = () => {
    navigate('/posts');
  };

  const handleCancel = () => {
    navigate('/posts');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Ошибка</h3>
                <div className="mt-2 text-red-700">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/posts')}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Вернуться к списку постов
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/posts')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к списку постов
          </button>
        </div>

        {post && (
          <PostForm
            post={post}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditPost; 
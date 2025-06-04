import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageForm from '../components/forms/PageForm';
import { api } from '../lib/axios.config';
import Icon from '../components/ui/Icon';

interface PageData {
  id: number;
  title: string;
  content: string;
  slug: string;
  image?: string;
  is_published: boolean;
  is_homepage: boolean;
  template_name: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  site: number;
  site_name?: string;
  author: number;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Страница редактирования страницы
 */
const EditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!id) {
        setError('ID страницы не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await api.get<PageData>(`/pages/${id}/`);
        setPage(data);
      } catch (error: unknown) {
        const apiError = error as { message?: string };
        setError(apiError.message || 'Ошибка загрузки страницы');
        console.error('Error fetching page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [id]);

  const handleSuccess = () => {
    navigate('/pages');
  };

  const handleCancel = () => {
    navigate('/pages');
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
                <Icon name="warning" size="lg" color="danger" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Ошибка</h3>
                <div className="mt-2 text-red-700">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/pages')}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Вернуться к списку страниц
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/pages')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Icon name="arrowLeft" size="sm" className="mr-2" />
            Назад к списку страниц
          </button>
        </div>

        {page && (
          <PageForm
            page={page}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditPage; 
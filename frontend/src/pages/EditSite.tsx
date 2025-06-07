import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import SiteForm from '../components/forms/SiteForm';
import Icon from '../components/ui/Icon';
import { useSitesStore } from '../store';

/**
 * Страница редактирования сайта
 */
const EditSite: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const siteId = id ? parseInt(id, 10) : null;

  const { 
    currentSite, 
    isLoading, 
    error, 
    fetchSite, 
    clearError 
  } = useSitesStore();

  // Загружаем данные сайта
  useEffect(() => {
    if (siteId) {
      fetchSite(siteId);
    }
  }, [siteId, fetchSite]);

  // Очищаем ошибки при размонтировании
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSuccess = () => {
    navigate('/sites');
  };

  const handleCancel = () => {
    navigate('/sites');
  };

  if (!siteId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">Некорректный ID сайта</p>
          <button
            onClick={() => navigate('/sites')}
            className="text-primary-600 hover:text-primary-700"
          >
            Вернуться к списку сайтов
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
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
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/sites')}
            className="text-primary-600 hover:text-primary-700"
          >
            Вернуться к списку сайтов
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentSite) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Сайт не найден</h1>
          <p className="text-gray-600 mb-4">Запрашиваемый сайт не существует</p>
          <button
            onClick={() => navigate('/sites')}
            className="text-primary-600 hover:text-primary-700"
          >
            Вернуться к списку сайтов
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center">
          <button
            onClick={() => navigate('/sites')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <Icon name="arrowLeft" className="mr-2" />Назад к сайтам
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Редактировать сайт: {currentSite.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Обновите информацию о вашем сайте
            </p>
          </div>
        </div>

        {/* Form */}
        <SiteForm 
          site={currentSite}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default EditSite; 
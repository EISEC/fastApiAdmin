import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import SiteForm from '../components/forms/SiteForm';
import Icon from '../components/ui/Icon';

/**
 * Страница создания нового сайта
 */
const CreateSite: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/sites');
  };

  const handleCancel = () => {
    navigate('/sites');
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Создать новый сайт</h1>
            <p className="mt-1 text-sm text-gray-600">
              Заполните информацию для создания нового сайта
            </p>
          </div>
        </div>

        {/* Form */}
        <SiteForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateSite; 
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageForm from '../components/forms/PageForm';
import Icon from '../components/ui/Icon';

/**
 * Страница создания новой страницы
 */
const CreatePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/pages');
  };

  const handleCancel = () => {
    navigate('/pages');
  };

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

        <PageForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreatePage; 
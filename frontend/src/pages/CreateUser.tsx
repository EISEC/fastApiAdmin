import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import UserForm from '../components/forms/UserForm';

/**
 * Страница создания нового пользователя
 */
const CreateUser: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/users');
  };

  const handleCancel = () => {
    navigate('/users');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <button
            onClick={() => navigate('/users')}
            className="hover:text-gray-700 transition-colors"
          >
            👥 Пользователи
          </button>
          <span>→</span>
          <span className="text-gray-900 font-medium">Новый пользователь</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ✨ Создание нового пользователя
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Заполните информацию для создания новой учетной записи
              </p>
            </div>
            <div className="text-6xl">👤</div>
          </div>
        </div>

        {/* Form */}
        <UserForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateUser; 
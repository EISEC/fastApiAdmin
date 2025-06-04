import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import UserForm from '../components/forms/UserForm';
import Icon from '../components/ui/Icon';

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
            <Icon name="users" size="md" className="mr-2" />
            Пользователи
          </button>
          {' / '}
          <span className="text-gray-900 font-medium">
            <Icon name="add" size="md" className="mr-2" />
            Создание нового пользователя
          </span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Icon name="add" size="lg" className="mr-2" />
                Создание нового пользователя
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Заполните информацию для создания новой учетной записи
              </p>
            </div>
            <Icon name="user" size="2xl" className="text-gray-400" />
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
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PostForm from '../components/forms/PostForm';
import Icon from '../components/ui/Icon';

/**
 * Страница создания нового поста
 */
const CreatePost: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/posts');
  };

  const handleCancel = () => {
    navigate('/posts');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/posts')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Icon name="arrowLeft" size="sm" className="mr-2" />
            Назад к списку постов
          </button>
        </div>

        <PostForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreatePost; 
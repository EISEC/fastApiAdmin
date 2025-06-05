import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DynamicModelForm from '../components/forms/DynamicModelForm';
import { useDynamicModelsStore } from '../store/dynamicModelsStore';
import type { DynamicModelCreateData, DynamicModelUpdateData } from '../types/dynamicModel.types';

/**
 * Страница создания новой динамической модели
 */
const CreateDynamicModelPage: React.FC = () => {
  const navigate = useNavigate();
  const { createModel } = useDynamicModelsStore();

  const handleSubmit = async (data: DynamicModelCreateData | DynamicModelUpdateData) => {
    const newModel = await createModel(data as DynamicModelCreateData);
    if (newModel) {
      navigate('/dynamic-models');
    }
  };

  const handleCancel = () => {
    navigate('/dynamic-models');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            🔨 Создание динамической модели
          </h1>
          <p className="text-gray-600 mt-1">
            Создайте новую модель данных для вашего проекта
          </p>
        </div>

        <DynamicModelForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateDynamicModelPage; 
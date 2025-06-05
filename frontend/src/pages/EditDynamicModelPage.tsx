import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DynamicModelForm from '../components/forms/DynamicModelForm';
import { Spinner } from '../components/ui';
import { useDynamicModelsStore } from '../store/dynamicModelsStore';
import type { DynamicModel, DynamicModelCreateData, DynamicModelUpdateData } from '../types/dynamicModel.types';
import { Icon } from '../components/ui';

/**
 * Страница редактирования динамической модели
 */
const EditDynamicModelPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateModel, fetchModel } = useDynamicModelsStore();
  
  const [model, setModel] = useState<DynamicModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModel();
  }, [id]);

  const loadModel = async () => {
    if (!id) {
      setError('ID модели не указан');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const modelData = await fetchModel(parseInt(id));
      if (modelData) {
        setModel(modelData);
      } else {
        setError('Модель не найдена');
      }
    } catch (err) {
      setError('Ошибка загрузки модели');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: DynamicModelCreateData | DynamicModelUpdateData) => {
    if (!model) return;
    
    const updatedModel = await updateModel(model.id, data as DynamicModelUpdateData);
    if (updatedModel) {
      navigate('/dynamic-models');
    }
  };

  const handleCancel = () => {
    navigate('/dynamic-models');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !model) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Ошибка загрузки
            </h3>
            <p className="text-red-700">
              {error || 'Модель не найдена'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Icon name="edit" className="mr-3" />
            Редактирование модели: {model.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Изменение структуры и настроек динамической модели
          </p>
        </div>

        <DynamicModelForm
          model={model}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default EditDynamicModelPage; 
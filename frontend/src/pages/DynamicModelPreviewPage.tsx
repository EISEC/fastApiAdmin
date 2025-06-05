import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDynamicModelsStore } from '../store/dynamicModelsStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Button, Spinner } from '../components/ui';
import Card from '../components/ui/Card';
import Icon from '../components/ui/Icon';
import type { DynamicModel, DynamicModelPreview } from '../types/dynamicModel.types';

/**
 * Страница превью динамической модели
 */
const DynamicModelPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    selectedModel,
    preview,
    previewLoading,
    fetchModel,
    generatePreview
  } = useDynamicModelsStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await fetchModel(parseInt(id));
      await generatePreview(parseInt(id));
    } catch (err) {
      setError('Ошибка загрузки данных модели');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToModels = () => {
    navigate('/dynamic-models');
  };

  const handleEditModel = () => {
    if (selectedModel) {
      navigate(`/dynamic-models/${selectedModel.id}/edit`);
    }
  };

  const renderFieldPreview = (field: any) => {
    const { name, type, label, required, ui_component, sample_value } = field;
    
    const fieldId = `preview-${name}`;
    const isRequired = required;
    
    return (
      <div key={name} className="space-y-2">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {(() => {
          switch (type) {
            case 'text':
            case 'email':
            case 'url':
              return (
                <input
                  id={fieldId}
                  type={type}
                  value={sample_value || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  placeholder={`Пример ${label.toLowerCase()}`}
                />
              );
            
            case 'textarea':
              return (
                <textarea
                  id={fieldId}
                  value={sample_value || ''}
                  disabled
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  placeholder={`Пример ${label.toLowerCase()}`}
                />
              );
            
            case 'number':
              return (
                <input
                  id={fieldId}
                  type="number"
                  value={sample_value || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  placeholder="123"
                />
              );
            
            case 'boolean':
              return (
                <div className="flex items-center gap-2">
                  <input
                    id={fieldId}
                    type="checkbox"
                    checked={sample_value || false}
                    disabled
                    className="rounded border-gray-300 text-primary-600 bg-gray-50"
                  />
                  <span className="text-sm text-gray-500">
                    {sample_value ? 'Включено' : 'Выключено'}
                  </span>
                </div>
              );
            
            case 'date':
              return (
                <input
                  id={fieldId}
                  type="date"
                  value={sample_value || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              );
            
            case 'datetime':
              return (
                <input
                  id={fieldId}
                  type="datetime-local"
                  value={sample_value || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              );
            
            case 'select':
              return (
                <select
                  id={fieldId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                >
                  <option>{sample_value || 'Выберите опцию'}</option>
                </select>
              );
            
            case 'file':
            case 'image':
              return (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                  <div className="text-center">
                    <Icon name="upload" size="lg" className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {type === 'image' ? 'Загрузка изображения' : 'Загрузка файла'}
                    </p>
                  </div>
                </div>
              );
            
            default:
              return (
                <input
                  id={fieldId}
                  type="text"
                  value={sample_value || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  placeholder={`Пример ${label.toLowerCase()}`}
                />
              );
          }
        })()}
        
        <p className="text-xs text-gray-400">
          Тип: {type} • Компонент: {ui_component}
        </p>
      </div>
    );
  };

  if (!id) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-gray-900">
            ID модели не указан
          </h1>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || previewLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !selectedModel) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            {error || 'Модель не найдена'}
          </h1>
          <Button onClick={handleBackToModels}>
            Вернуться к моделям
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToModels}
              >
                <Icon name="arrowLeft" size="sm" className="mr-2" />
                Назад
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Icon name="eye" className="mr-3" />
                Превью модели: {selectedModel.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {selectedModel.model_type === 'standalone' ? (
                  <span className="flex items-center">
                    <Icon name="code" className="mr-2" size="sm" />
                    Отдельная модель
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Icon name="link" className="mr-2" size="sm" />
                    Расширение модели
                  </span>
                )}
              </p>
            </div>
            <p className="text-gray-600">
              Демонстрация формы и таблицы данных модели
            </p>
          </div>
          
          <Button onClick={handleEditModel}>
            <Icon name="edit" size="sm" className="mr-2" />
            Редактировать
          </Button>
        </div>

        {/* Информация о модели */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Тип модели</h3>
              <p className="text-lg font-semibold flex items-center">
                {selectedModel.model_type === 'standalone' ? (
                  <>
                    <Icon name="code" className="mr-2" size="sm" />
                    Отдельная модель
                  </>
                ) : (
                  <>
                    <Icon name="link" className="mr-2" size="sm" />
                    Расширение модели
                  </>
                )}
              </p>
              {selectedModel.target_model && (
                <p className="text-sm text-gray-600 mt-1">
                  Расширяет: {selectedModel.target_model}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Количество полей</h3>
              <p className="text-lg font-semibold">
                {preview?.model_info.fields_count || selectedModel.fields_config?.fields?.length || 0}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Описание</h3>
              <p className="text-sm text-gray-700">
                {selectedModel.description || 'Без описания'}
              </p>
            </div>
          </div>
        </Card>

        {preview ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Превью формы */}
            <Card className="h-fit">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon name="edit" className="mr-2" />
                  Превью формы
                </h3>
                
                <div className="space-y-4">
                  {preview.form_preview.map(renderFieldPreview)}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex gap-3">
                      <button
                        disabled
                        className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium opacity-50 cursor-not-allowed"
                      >
                        Сохранить
                      </button>
                      <button
                        disabled
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium opacity-50 cursor-not-allowed"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Превью таблицы */}
            <Card className="h-fit">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon name="database" className="mr-2" />
                  Превью таблицы
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {preview.table_preview.columns.map(column => (
                          <th
                            key={column.name}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column.label}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.table_preview.sample_data.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {preview.table_preview.columns.map(column => (
                            <td key={column.name} className="px-4 py-3 text-sm text-gray-900">
                              {row[column.name] || '—'}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-1">
                              <button
                                disabled
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                              >
                                <Icon name="edit" size="sm" />
                              </button>
                              <button
                                disabled
                                className="p-1 text-gray-400 hover:text-red-600 disabled:cursor-not-allowed"
                              >
                                <Icon name="delete" size="sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {preview.table_preview.sample_data.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Icon name="database" size="lg" className="mx-auto mb-2 text-gray-300" />
                      Нет примеров данных
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Icon name="alert" size="xl" className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Превью недоступно
            </h3>
            <p className="text-gray-600">
              Не удалось сгенерировать превью для этой модели
            </p>
          </Card>
        )}

        {/* Дополнительная информация */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Icon name="info" className="mr-2" />
              Информация о модели
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Таблица базы данных</h4>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                  {selectedModel.table_name}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Версия</h4>
                <p className="text-sm text-gray-600">
                  v{selectedModel.version}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Статус</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedModel.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedModel.is_active ? 'Активная' : 'Неактивная'}
                </span>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Создана</h4>
                <p className="text-sm text-gray-600">
                  {new Date(selectedModel.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DynamicModelPreviewPage; 
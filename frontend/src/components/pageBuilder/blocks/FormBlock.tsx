import React, { useState } from 'react';
import type { BlockConfig, FormBlockData, FormFieldConfig } from '../../../types';

interface FormBlockProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Блок формы с настраиваемыми полями
 */
const FormBlock: React.FC<FormBlockProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate
}) => {
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const formData = block.data as FormBlockData;

  const handleTitleChange = (title: string) => {
    onUpdate?.({
      data: { ...formData, title }
    });
  };

  const handleSubmitTextChange = (submitText: string) => {
    onUpdate?.({
      data: { ...formData, submitText }
    });
  };

  const handleAddField = () => {
    const newField: FormFieldConfig = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Новое поле',
      required: false
    };

    onUpdate?.({
      data: {
        ...formData,
        fields: [...(formData.fields || []), newField]
      }
    });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormFieldConfig>) => {
    const updatedFields = (formData.fields || []).map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );

    onUpdate?.({
      data: { ...formData, fields: updatedFields }
    });
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = (formData.fields || []).filter(field => field.id !== fieldId);
    onUpdate?.({
      data: { ...formData, fields: updatedFields }
    });
  };

  const fieldTypes = [
    { value: 'text', label: 'Текст' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Телефон' },
    { value: 'textarea', label: 'Многострочный текст' },
    { value: 'select', label: 'Выбор' },
    { value: 'checkbox', label: 'Чекбокс' },
    { value: 'radio', label: 'Радио кнопки' }
  ];

  return (
    <div 
      className={`${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      style={{ 
        padding: block.styles?.padding || '24px',
        backgroundColor: block.styles?.backgroundColor || '#f9fafb',
        borderRadius: block.styles?.borderRadius || '12px'
      }}
    >
      {isEditingForm && isEditing ? (
        <div className="space-y-4 bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-700">
            Настройки формы
          </div>
          
          {/* Заголовок формы */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Заголовок формы
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Текст кнопки */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Текст кнопки
            </label>
            <input
              type="text"
              value={formData.submitText}
              onChange={(e) => handleSubmitTextChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Поля формы */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-600">
                Поля формы
              </label>
              <button
                onClick={handleAddField}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                + Добавить поле
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(formData.fields || []).map((field) => (
                <div key={field.id} className="p-3 border border-gray-200 rounded-lg">
                  {editingField === field.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                        placeholder="Название поля"
                      />
                      
                      <div className="flex gap-2">
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateField(field.id, { type: e.target.value as FormFieldConfig['type'] })}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                        >
                          {fieldTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                            className="mr-1"
                          />
                          Обязательное
                        </label>
                      </div>
                      
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                        placeholder="Подсказка"
                      />
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingField(null)}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Готово
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer"
                      onClick={() => setEditingField(field.id)}
                    >
                      <div className="text-xs font-medium text-gray-700">
                        {field.label} ({fieldTypes.find(t => t.value === field.type)?.label})
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {field.placeholder && `Подсказка: ${field.placeholder}`}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setIsEditingForm(false)}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Готово
          </button>
        </div>
      ) : (
        <div
          onClick={() => {
            if (isEditing) {
              setIsEditingForm(true);
            }
          }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {formData.title || 'Форма'}
          </h3>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {(formData.fields || []).map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={field.placeholder}
                    rows={3}
                    disabled={isEditing}
                  />
                ) : field.type === 'select' ? (
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isEditing}
                  >
                    <option value="">Выберите опцию</option>
                    {(field.options || []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center">
                    <input 
                      type="checkbox"
                      className="mr-2"
                      disabled={isEditing}
                    />
                    {field.placeholder || field.label}
                  </label>
                ) : (
                  <input 
                    type={field.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={field.placeholder}
                    disabled={isEditing}
                  />
                )}
              </div>
            ))}
            
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              disabled={isEditing}
            >
              {formData.submitText || 'Отправить'}
            </button>
          </form>
          
          {isSelected && isEditing && (
            <div className="mt-4 text-center">
              <div className="text-xs text-blue-500 bg-white px-2 py-1 rounded shadow inline-block">
                нажмите для настройки формы
              </div>
            </div>
          )}
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
          📋 Форма
        </div>
      )}
    </div>
  );
};

export default FormBlock; 
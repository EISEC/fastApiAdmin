import React, { useState } from 'react';
import { clsx } from 'clsx';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { useToastStore } from '../../store/toastStore';

interface FieldSchema {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: FieldOption[];
  validation?: FieldValidation;
  default_value?: any;
  help_text?: string;
  order: number;
}

interface FieldOption {
  value: string;
  label: string;
}

interface FieldValidation {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
}

type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'url' 
  | 'date' 
  | 'datetime' 
  | 'boolean' 
  | 'select' 
  | 'multiselect'
  | 'file'
  | 'image'
  | 'json';

interface DynamicModelBuilderProps {
  fields: FieldSchema[];
  onChange: (fields: FieldSchema[]) => void;
  className?: string;
}

/**
 * Конструктор динамических моделей
 * Позволяет создавать и настраивать поля для динамических форм
 */
const DynamicModelBuilder: React.FC<DynamicModelBuilderProps> = ({
  fields,
  onChange,
  className
}) => {
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldSchema | null>(null);
  const [newField, setNewField] = useState<Partial<FieldSchema>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    help_text: '',
  });
  const addToast = useToastStore(state => state.addToast);

  const fieldTypes = [
    { value: 'text', label: 'Текст' },
    { value: 'textarea', label: 'Многострочный текст' },
    { value: 'number', label: 'Число' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Дата' },
    { value: 'datetime', label: 'Дата и время' },
    { value: 'boolean', label: 'Да/Нет' },
    { value: 'select', label: 'Выбор (один)' },
    { value: 'multiselect', label: 'Выбор (множественный)' },
    { value: 'file', label: 'Файл' },
    { value: 'image', label: 'Изображение' },
    { value: 'json', label: 'JSON данные' },
  ];

  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddField = () => {
    if (!newField.name || !newField.label) {
      addToast({ type: 'error', title: 'Заполните название и метку поля' });
      return;
    }

    // Проверяем уникальность имени поля
    if (fields.some(field => field.name === newField.name)) {
      addToast({ type: 'error', title: 'Поле с таким именем уже существует' });
      return;
    }

    const field: FieldSchema = {
      id: generateFieldId(),
      name: newField.name!,
      label: newField.label!,
      type: newField.type as FieldType,
      required: newField.required || false,
      help_text: newField.help_text || '',
      order: fields.length,
      options: newField.type === 'select' || newField.type === 'multiselect' ? [] : undefined,
    };

    onChange([...fields, field]);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      help_text: '',
    });
    setIsAddFieldOpen(false);
    addToast({ type: 'success', title: 'Поле добавлено' });
  };

  const handleEditField = (field: FieldSchema) => {
    setEditingField(field);
    setNewField({ ...field });
    setIsAddFieldOpen(true);
  };

  const handleUpdateField = () => {
    if (!editingField || !newField.name || !newField.label) {
      addToast({ type: 'error', title: 'Заполните все обязательные поля' });
      return;
    }

    // Проверяем уникальность имени поля (исключая текущее)
    if (fields.some(field => field.name === newField.name && field.id !== editingField.id)) {
      addToast({ type: 'error', title: 'Поле с таким именем уже существует' });
      return;
    }

    const updatedFields = fields.map(field => 
      field.id === editingField.id 
        ? { ...field, ...newField } as FieldSchema
        : field
    );

    onChange(updatedFields);
    setEditingField(null);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      help_text: '',
    });
    setIsAddFieldOpen(false);
    addToast({ type: 'success', title: 'Поле обновлено' });
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = fields.filter(field => field.id !== fieldId);
    onChange(updatedFields);
    addToast({ type: 'success', title: 'Поле удалено' });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedFields = Array.from(fields);
    const [removed] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, removed);

    // Обновляем порядок полей
    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      order: index
    }));

    onChange(updatedFields);
  };

  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case 'text': return 'edit';
      case 'textarea': return 'file';
      case 'number': return 'settings';
      case 'email': return 'mail';
      case 'url': return 'link';
      case 'date': return 'calendar';
      case 'datetime': return 'clock';
      case 'boolean': return 'check';
      case 'select': return 'arrowDown';
      case 'multiselect': return 'menu';
      case 'file': return 'upload';
      case 'image': return 'image';
      case 'json': return 'code';
      default: return 'edit';
    }
  };

  const handleCloseModal = () => {
    setIsAddFieldOpen(false);
    setEditingField(null);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      help_text: '',
    });
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Поля модели
          </h3>
          <p className="text-sm text-gray-500">
            Перетаскивайте поля для изменения порядка
          </p>
        </div>
        <Button onClick={() => setIsAddFieldOpen(true)}>
          <Icon name="add" size="xs" className="mr-1" />
          Добавить поле
        </Button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Icon name="database" size="lg" className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет полей
          </h3>
          <p className="text-gray-500 mb-4">
            Добавьте первое поле для вашей динамической модели
          </p>
          <Button onClick={() => setIsAddFieldOpen(true)}>
            Добавить поле
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {fields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={clsx(
                          'bg-white rounded-lg border border-gray-200 p-4 transition-shadow',
                          snapshot.isDragging && 'shadow-lg'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div
                              {...provided.dragHandleProps}
                              className="mr-3 text-gray-400 hover:text-gray-600 cursor-grab"
                            >
                              <Icon name="menu" size="sm" />
                            </div>
                            
                            <div className="flex items-center mr-4">
                              <Icon 
                                name={getFieldIcon(field.type) as any} 
                                size="sm" 
                                className="mr-2 text-blue-600" 
                              />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {field.label}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {field.name} • {fieldTypes.find(t => t.value === field.type)?.label}
                                </div>
                              </div>
                            </div>
                            
                            {field.help_text && (
                              <div className="flex-1 text-sm text-gray-500 mr-4">
                                {field.help_text}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditField(field)}
                            >
                              <Icon name="edit" size="xs" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              <Icon name="delete" size="xs" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add/Edit Field Modal */}
      <Modal
        isOpen={isAddFieldOpen}
        onClose={handleCloseModal}
        title={editingField ? 'Редактировать поле' : 'Добавить новое поле'}
      >
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название поля *
                </label>
                <Input
                  value={newField.name || ''}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  placeholder="field_name"
                  pattern="[a-z_][a-z0-9_]*"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Только латинские буквы, цифры и подчеркивания
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Метка поля *
                </label>
                <Input
                  value={newField.label || ''}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="Название поля"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип поля
              </label>
              <Select
                value={newField.type || 'text'}
                onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
                options={fieldTypes}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <Textarea
                value={newField.help_text || ''}
                onChange={(e) => setNewField({ ...newField, help_text: e.target.value })}
                placeholder="Подсказка для пользователя"
                rows={2}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={newField.required || false}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
                Обязательное поле
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="primary"
                onClick={editingField ? handleUpdateField : handleAddField}
                className="flex-1"
              >
                {editingField ? 'Обновить поле' : 'Добавить поле'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCloseModal}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DynamicModelBuilder; 
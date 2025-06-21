import React from 'react';
import { UseFormRegister, FieldError, Control, Controller } from 'react-hook-form';
import { Input, Textarea, Select, Switch, FileUpload } from '../ui';
import Icon from '../ui/Icon';

interface FieldOption {
  value: string;
  label: string;
}

interface DynamicField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: FieldOption[];
  default_value?: any;
  validation?: any;
}

interface DynamicFieldRendererProps {
  field: DynamicField;
  register: UseFormRegister<any>;
  control: Control<any>;
  error?: FieldError;
  value?: any;
  onChange?: (value: any) => void;
}

/**
 * Компонент для рендеринга полей динамических моделей
 */
const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  register,
  control,
  error,
  value,
  onChange
}) => {
  const getErrorMessage = (error: any) => {
    if (error && typeof error === 'object' && 'message' in error) {
      return error.message;
    }
    return 'Ошибка валидации';
  };

  const renderLabel = () => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const renderHelpText = () => {
    if (!field.help_text) return null;
    return (
      <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
    );
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <p className="mt-1 text-sm text-red-600">{getErrorMessage(error)}</p>
    );
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'phone' ? 'tel' : 'text'}
            {...register(field.name)}
            placeholder={field.placeholder || field.help_text}
            error={!!error}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'textarea':
    case 'rich_text':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Textarea
            {...register(field.name)}
            placeholder={field.placeholder || field.help_text}
            rows={field.type === 'rich_text' ? 8 : 4}
            error={!!error}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'number':
    case 'decimal':
    case 'range':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Input
            type="number"
            step={field.type === 'decimal' ? '0.01' : field.type === 'range' ? '1' : undefined}
            {...register(field.name, { valueAsNumber: true })}
            placeholder={field.placeholder || field.help_text}
            error={!!error}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'date':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Input
            type="date"
            {...register(field.name)}
            error={!!error}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'datetime':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Input
            type="datetime-local"
            {...register(field.name)}
            error={!!error}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'time':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Input
            type="time"
            {...register(field.name)}
            error={!!error}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'boolean':
      return (
        <div key={field.name} className="space-y-2">
          <div className="flex items-start gap-3">
            <Controller
              name={field.name}
              control={control}
              render={({ field: formField }) => (
                <Switch
                  checked={formField.value || false}
                  onChange={formField.onChange}
                  label={field.label}
                />
              )}
            />
            {field.required && <span className="text-red-500 text-sm">*</span>}
          </div>
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'select':
    case 'radio':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Select
                value={formField.value || ''}
                onChange={formField.onChange}
                options={field.options?.map((opt) => ({
                  value: opt.value,
                  label: opt.label
                })) || []}
                placeholder={field.placeholder || `Выберите ${field.label.toLowerCase()}`}
                error={!!error}
              />
            )}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'multiselect':
    case 'checkbox':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Controller
            name={field.name}
            control={control}
            defaultValue={[]}
            render={({ field: formField }) => (
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={formField.value?.includes(option.value) || false}
                      onChange={(e) => {
                        const currentValues = formField.value || [];
                        if (e.target.checked) {
                          formField.onChange([...currentValues, option.value]);
                        } else {
                          formField.onChange(currentValues.filter((v: string) => v !== option.value));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'file':
      return (
        <div key={field.name}>
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <FileUpload
                label={field.label + (field.required ? ' *' : '')}
                value={formField.value}
                onChange={formField.onChange}
                accept="*/*"
                error={!!error}
                helperText={error ? getErrorMessage(error) : field.help_text}
                preview={false}
              />
            )}
          />
        </div>
      );

    case 'image':
    case 'gallery':
      return (
        <div key={field.name}>
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <FileUpload
                label={field.label + (field.required ? ' *' : '')}
                value={formField.value}
                onChange={formField.onChange}
                accept="image/*"
                error={!!error}
                helperText={error ? getErrorMessage(error) : field.help_text}
                preview={true}
              />
            )}
          />
        </div>
      );

    case 'color':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formField.value || '#000000'}
                  onChange={formField.onChange}
                  className="w-20 h-10 p-1 rounded cursor-pointer border border-gray-300"
                />
                <Input
                  type="text"
                  value={formField.value || ''}
                  onChange={(e) => formField.onChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                  error={!!error}
                />
              </div>
            )}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'rating':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => formField.onChange(rating)}
                    className={`text-2xl transition-colors ${
                      (formField.value || 0) >= rating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Icon name="star" />
                  </button>
                ))}
                {formField.value && (
                  <button
                    type="button"
                    onClick={() => formField.onChange(0)}
                    className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            )}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );

    case 'json':
      return (
        <div key={field.name}>
          {renderLabel()}
          <Textarea
            {...register(field.name)}
            placeholder={field.placeholder || '{"key": "value"}'}
            rows={6}
            className="font-mono"
            error={!!error}
          />
          {renderError()}
          {renderHelpText()}
          <p className="mt-1 text-xs text-gray-500">
            <Icon name="info" size="sm" className="inline mr-1" />
            Введите валидный JSON
          </p>
        </div>
      );

    default:
      return (
        <div key={field.name}>
          {renderLabel()}
          <Input
            type="text"
            {...register(field.name)}
            placeholder={field.placeholder || field.help_text}
            error={!!error}
          />
          {renderError()}
          {renderHelpText()}
        </div>
      );
  }
};

export default DynamicFieldRenderer; 
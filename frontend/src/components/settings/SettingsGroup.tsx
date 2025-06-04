import React from 'react';
import type { SettingsGroup as SettingsGroupType, Setting } from '../../types/settings.types';
import Button from '../ui/Button';

interface SettingsGroupProps {
  group: SettingsGroupType;
  values: Record<string, any>;
  errors: Record<string, string[]>;
  onChange: (key: string, value: any) => void;
  onSave?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  hasChanges?: boolean;
}

/**
 * Компонент группы настроек
 */
const SettingsGroup: React.FC<SettingsGroupProps> = ({
  group,
  values,
  errors,
  onChange,
  onSave,
  onReset,
  isLoading = false,
  hasChanges = false
}) => {
  const renderSettingField = (setting: Setting) => {
    const value = values[setting.key] !== undefined ? values[setting.key] : setting.value;
    const fieldErrors = errors[setting.key];
    const hasError = fieldErrors && fieldErrors.length > 0;

    const handleChange = (newValue: any) => {
      onChange(setting.key, newValue);
    };

    // Простая реализация без внешних компонентов
    const renderField = () => {
      switch (setting.type) {
        case 'boolean':
          return (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={isLoading || setting.readonly}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700">
                {setting.label}
              </span>
            </label>
          );

        case 'select':
          return (
            <select
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isLoading || setting.readonly}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{setting.placeholder || 'Выберите значение'}</option>
              {setting.options?.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'textarea':
          return (
            <textarea
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={setting.placeholder}
              disabled={isLoading || setting.readonly}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          );

        case 'number':
          return (
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(Number(e.target.value))}
              placeholder={setting.placeholder}
              disabled={isLoading || setting.readonly}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          );

        case 'color':
          return (
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => handleChange(e.target.value)}
                disabled={isLoading || setting.readonly}
                className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={value || ''}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="#000000"
                disabled={isLoading || setting.readonly}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  hasError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          );

        default:
          return (
            <input
              type={setting.type === 'email' ? 'email' : setting.type === 'url' ? 'url' : setting.type === 'password' ? 'password' : 'text'}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={setting.placeholder}
              disabled={isLoading || setting.readonly}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          );
      }
    };

    if (setting.type === 'boolean') {
      return (
        <div key={setting.key} className="space-y-2">
          {renderField()}
          {setting.description && (
            <p className="text-sm text-gray-600 ml-6">
              {setting.description}
            </p>
          )}
          {hasError && (
            <div className="ml-6 space-y-1">
              {fieldErrors?.map((err, index) => (
                <p key={index} className="text-sm text-red-600">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={setting.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {setting.label}
            {setting.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {setting.helpUrl && (
            <a
              href={setting.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
              title="Справка"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </a>
          )}
        </div>

        {setting.description && (
          <p className="text-sm text-gray-600">
            {setting.description}
          </p>
        )}

        <div className="relative">
          {renderField()}
          
          {values[setting.key] !== undefined && values[setting.key] !== setting.value && (
            <div className="absolute -right-2 -top-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-white" 
                   title="Есть несохраненные изменения" />
            </div>
          )}
        </div>

        {hasError && (
          <div className="space-y-1">
            {fieldErrors?.map((err, index) => (
              <p key={index} className="text-sm text-red-600">
                {err}
              </p>
            ))}
          </div>
        )}

        {setting.helpText && !hasError && (
          <p className="text-xs text-gray-500">
            {setting.helpText}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {group.icon && <span className="text-lg">{group.icon}</span>}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {group.name}
              </h3>
              {group.description && (
                <p className="text-sm text-gray-600">
                  {group.description}
                </p>
              )}
            </div>
          </div>

          {hasChanges && (
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onReset}
                disabled={isLoading}
              >
                Сбросить
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={isLoading}
                loading={isLoading}
              >
                Сохранить
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-6">
          {group.settings
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(renderSettingField)}
        </div>
      </div>
    </div>
  );
};

export default SettingsGroup; 
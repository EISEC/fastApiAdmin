import React from 'react';
import type { SettingsGroup as SettingsGroupType, Setting } from '../../types/settings.types';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import IntegrationsSettings from './IntegrationsSettings';
import { getIconName } from '../../utils/iconMapping';

interface SettingsGroupProps {
  group: SettingsGroupType;
  values: Record<string, any>;
  errors: Record<string, string[]>;
  onChange: (key: string, value: any) => void;
  onSave?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  hasChanges?: boolean;
  siteId?: string | number;
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
  hasChanges = false,
  siteId
}) => {
  // Для отладки: выводим id и структуру группы
  console.log('SettingsGroup:', group.id, group);

  // Если в группе нет настроек — ничего не рендерим
  if (!group.settings || group.settings.length === 0) {
    return null;
  }

  // Специальные компоненты для определенных групп
  if (group.id === 'social' || group.id === 'social_networks') {
    return null;
  }
  if (group.id === 'payment') {
    return <div className="p-6 text-gray-500">Настройки платежных систем появятся здесь</div>;
  }
  if (group.id === 'object_storage') {
    return <IntegrationsSettings />;
  }
  const integrationIds = ['integrations', 'yandex_storage', 'storage'];
  if (integrationIds.includes(group.id) && siteId) {
    return <IntegrationsSettings />;
  }

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
              <Icon name="question" size="sm" />
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

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  const hasUnsavedChanges = hasChanges;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
          {group.description && (
            <p className="mt-1 text-sm text-gray-500">{group.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-yellow-600">Есть несохраненные изменения</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            </div>
          )}
          {onReset && (
            <Button
              variant="secondary"
              onClick={onReset}
              disabled={isLoading || !hasChanges}
            >
              <Icon name="refresh" className="mr-2" />
              Сбросить
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="flex items-center"
          >
            <Icon name="check" className="mr-2" />
            Сохранить изменения
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {group.settings.map((setting) => (
          <div key={setting.key} className="bg-white rounded-lg p-4">
            {renderSettingField(setting)}
            {errors[setting.key] && (
              <p className="mt-2 text-sm text-red-600">{errors[setting.key].join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsGroup; 
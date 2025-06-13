import React from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

interface SocialNetworkFormData {
  name: string;
  url: string;
  is_enabled: boolean;
}

interface SocialNetworkFormProps {
  formData: SocialNetworkFormData;
  setFormData: (data: SocialNetworkFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEditing: boolean;
  socialChoices: Array<{ value: string; label: string }>;
}

const SocialNetworkForm: React.FC<SocialNetworkFormProps> = ({
  formData,
  setFormData,
  onSave,
  onCancel,
  isLoading,
  isEditing,
  socialChoices,
}) => {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-medium text-gray-900 mb-4">
        {isEditing ? 'Редактирование социальной сети' : 'Добавление социальной сети'}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Социальная сеть *
          </label>
          <select
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isEditing}
          >
            <option value="">Выберите социальную сеть</option>
            {socialChoices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL профиля *
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_enabled}
              onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Активна</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 mt-4">
        <Button variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button 
          variant="primary" 
          onClick={onSave}
          disabled={isLoading}
          loading={isLoading}
        >
          {isEditing ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </div>
  );
};

export default SocialNetworkForm; 
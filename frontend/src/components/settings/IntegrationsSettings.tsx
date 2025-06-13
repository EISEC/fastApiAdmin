import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import Input from '../ui/Input';
import { api } from '../../lib/axios.config';
import { useToastStore } from '../../store/toastStore';
import SocialNetworksManager from './SocialNetworksManager';

interface IntegrationsSettingsProps {}

interface StorageSettings {
  id?: string;
  access_key: string;
  secret_key: string;
  bucket_name: string;
  endpoint: string;
  region: string;
}

interface ApiResponse<T> {
  data: {
    results?: T[];
  } & T;
}

const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = () => {
  const [loading, setLoading] = useState(false);
  const [storageSettings, setStorageSettings] = useState<StorageSettings>({
    access_key: '',
    secret_key: '',
    bucket_name: '',
    endpoint: 'https://storage.yandexcloud.net',
    region: 'ru-central1',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const { success, error } = useToastStore();

  // Загрузка текущих глобальных настроек Object Storage
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/settings/all/');
        const settingsObj = Array.isArray(response)
          ? response.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
          : {};
        setStorageSettings({
          access_key: settingsObj['object_storage.access_key'] || '',
          secret_key: '', // Никогда не подгружаем секретный ключ в UI
          bucket_name: settingsObj['object_storage.bucket'] || '',
          endpoint: settingsObj['object_storage.endpoint'] || 'https://storage.yandexcloud.net',
          region: settingsObj['object_storage.region'] || 'ru-central1',
        });
      } catch (err) {
        console.error('Ошибка загрузки настроек:', err);
        error('Ошибка загрузки', 'Не удалось загрузить настройки Object Storage');
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStorageSettings({ ...storageSettings, [e.target.name]: e.target.value });
    setConnectionStatus(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings/bulk/', {
        updates: [
          { key: 'object_storage.access_key', value: storageSettings.access_key },
          { key: 'object_storage.secret_key', value: storageSettings.secret_key },
          { key: 'object_storage.bucket', value: storageSettings.bucket_name },
          { key: 'object_storage.endpoint', value: storageSettings.endpoint },
          { key: 'object_storage.region', value: storageSettings.region }
        ]
      });
      success('Настройки Object Storage сохранены');
      setStorageSettings(prev => ({ ...prev, secret_key: '' }));
    } catch (err: any) {
      error('Ошибка сохранения', err.response?.data?.detail || 'Не удалось сохранить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckConnection = async () => {
    setConnectionStatus('Проверка...');
    try {
      // Проверка подключения реализуется отдельно, если есть соответствующий endpoint
      setConnectionStatus('Проверьте подключение через backend');
      success('Проверьте подключение через backend');
    } catch (err: any) {
      setConnectionStatus(err.response?.data?.detail || 'Ошибка подключения');
      error('Ошибка подключения', err.response?.data?.detail || 'Не удалось подключиться к хранилищу');
    }
  };

  return (
    <div className="space-y-8">
      {/* Object Storage */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Object Storage (Яндекс Облако)</h3>
          <p className="text-sm text-gray-500 mb-4">Настройки для хранения файлов в Яндекс Object Storage</p>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="access_key"
                value={storageSettings.access_key}
                onChange={handleChange}
                label="Access Key"
                required
                helperText="Скопируйте из Яндекс Облака → Сервисные аккаунты"
              />
              <div className="relative">
                <Input
                  name="secret_key"
                  type={showSecret ? 'text' : 'password'}
                  value={storageSettings.secret_key}
                  onChange={handleChange}
                  label="Secret Key"
                  required
                  helperText="Секретный ключ из файла скачанного при создании ключа доступа"
                />
                <button
                  type="button"
                  className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  <Icon name={showSecret ? 'eyeOff' : 'eye'} size="sm" />
                </button>
              </div>
              <Input
                name="bucket_name"
                value={storageSettings.bucket_name}
                onChange={handleChange}
                label="Bucket Name"
                required
                helperText="Название бакета в Яндекс Object Storage"
              />
              <Input
                name="endpoint"
                value={storageSettings.endpoint}
                onChange={handleChange}
                label="Endpoint"
                required
                helperText="URL эндпоинта хранилища"
              />
              <Input
                name="region"
                value={storageSettings.region}
                onChange={handleChange}
                label="Регион"
                required
                helperText="Регион хранения данных"
              />
            </div>

            {connectionStatus && (
              <div className={`mt-2 text-sm ${
                connectionStatus.includes('успешно') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {connectionStatus}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                loading={loading}
              >
                Сохранить настройки
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Социальные сети */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Социальные сети</h3>
          <p className="text-sm text-gray-500 mb-4">Настройки внешних сервисов</p>
          <Button
            variant="primary"
            className="mb-4"
            onClick={() => window.dispatchEvent(new Event('open-social-form'))}
          >
            <Icon name="add" className="mr-2" /> Добавить социальную сеть
          </Button>
          <SocialNetworksManager />
        </div>
      </Card>
    </div>
  );
};

export default IntegrationsSettings; 
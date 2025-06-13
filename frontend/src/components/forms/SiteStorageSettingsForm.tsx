import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import Modal from '../ui/Modal';
import { api } from '../../lib/axios.config';

interface SiteStorageSettingsFormProps {
  siteId: string | number;
}

interface StorageFormState {
  id?: string;
  access_key: string;
  secret_key: string;
  bucket_name: string;
  endpoint: string;
  region: string;
}

const defaultState: StorageFormState = {
  access_key: '',
  secret_key: '',
  bucket_name: '',
  endpoint: 'https://storage.yandexcloud.net',
  region: 'ru-central1',
};

const SiteStorageSettingsForm: React.FC<SiteStorageSettingsFormProps> = ({ siteId }) => {
  const [form, setForm] = useState<StorageFormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    api.get(`/sites/storage-settings/?site=${siteId}`).then((data) => {
      if (Array.isArray(data) && data.length > 0) setForm({ ...data[0] });
    });
  }, [siteId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setConnectionStatus(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      if (form.id) {
        await api.put(`/sites/storage-settings/${form.id}/`, form);
      } else {
        await api.post(`/sites/storage-settings/`, { ...form, site: siteId });
      }
      setStatus('success');
      setForm((prev) => ({ ...prev, secret_key: '' })); // Очищаем секретный ключ после сохранения
    } catch (err: any) {
      setStatus(err.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckConnection = async () => {
    setConnectionStatus('Проверка...');
    try {
      await api.post('/sites/storage-settings/', { ...form, site: siteId });
      setConnectionStatus('Подключение успешно!');
    } catch (err: any) {
      setConnectionStatus(err.response?.data?.detail || 'Ошибка подключения');
    }
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setForm(defaultState);
    setStatus(null);
    setConnectionStatus(null);
    setShowResetModal(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="access_key"
          value={form.access_key}
          onChange={handleChange}
          label="Access Key"
          required
          helperText="Скопируйте из Яндекс Облака → Сервисные аккаунты"
        />
        <div className="relative">
          <Input
            name="secret_key"
            type={showSecret ? 'text' : 'password'}
            value={form.secret_key}
            onChange={handleChange}
            label="Secret Key"
            required
            helperText="Секретный ключ из файла скачанного при создании ключа доступа"
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-700"
            tabIndex={-1}
            onClick={() => setShowSecret((v) => !v)}
            title={showSecret ? 'Скрыть' : 'Показать'}
          >
            <Icon name={showSecret ? 'eyeOff' : 'eye'} size="md" />
          </button>
        </div>
        <Input
          name="bucket_name"
          value={form.bucket_name}
          onChange={handleChange}
          label="Bucket Name"
          required
          helperText="Имя бакета в Object Storage"
        />
        <Input
          name="endpoint"
          value={form.endpoint}
          onChange={handleChange}
          label="Endpoint"
          helperText="Обычно https://storage.yandexcloud.net"
        />
        <Input
          name="region"
          value={form.region}
          onChange={handleChange}
          label="Region"
          helperText="Обычно ru-central1"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <Button type="submit" loading={loading}>
          <Icon name="check" className="mr-2" />Сохранить
        </Button>
        <Button type="button" variant="secondary" onClick={handleReset}>
          <Icon name="refresh" className="mr-2" />Сбросить к дефолтным
        </Button>
        <Button type="button" variant="secondary" onClick={handleCheckConnection}>
          <Icon name="security" className="mr-2" />Проверить подключение
        </Button>
      </div>
      {status && <div className={status === 'success' ? 'text-green-600' : 'text-red-600'}>{status === 'success' ? 'Настройки сохранены' : status}</div>}
      {connectionStatus && <div className={connectionStatus === 'Подключение успешно!' ? 'text-green-600' : 'text-red-600'}>{connectionStatus}</div>}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Сбросить настройки?">
        <div className="p-6">
          <p className="mb-4">Вы уверены, что хотите сбросить настройки Object Storage к значениям по умолчанию?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={confirmReset}>
              Сбросить
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
};

export default SiteStorageSettingsForm; 
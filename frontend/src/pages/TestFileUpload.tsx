import React, { useState } from 'react';
import Card from '../components/ui/Card';
import CloudFileUpload from '../components/ui/CloudFileUpload';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { checkImageAvailability, checkCorsAvailability, isValidUrl } from '../utils/fileUtils';

/**
 * Тестовая страница для проверки системы загрузки файлов
 */
const TestFileUpload: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runDiagnostics = async () => {
    setTestResults([]);
    addTestResult('🚀 Начинаем диагностику...');

    // Тестируем изображение
    if (imageUrl) {
      addTestResult('🖼️ Тестируем изображение...');
      
      const isValid = isValidUrl(imageUrl);
      addTestResult(`URL валидный: ${isValid ? '✅' : '❌'}`);
      
      if (isValid) {
        const corsAvailable = await checkCorsAvailability(imageUrl);
        addTestResult(`CORS доступность: ${corsAvailable ? '✅' : '❌'}`);
        
        const imageAvailable = await checkImageAvailability(imageUrl);
        addTestResult(`Изображение загружается: ${imageAvailable ? '✅' : '❌'}`);
      }
    }

    // Тестируем документ
    if (documentUrl) {
      addTestResult('📄 Тестируем документ...');
      
      const isValid = isValidUrl(documentUrl);
      addTestResult(`URL валидный: ${isValid ? '✅' : '❌'}`);
      
      if (isValid) {
        const corsAvailable = await checkCorsAvailability(documentUrl);
        addTestResult(`CORS доступность: ${corsAvailable ? '✅' : '❌'}`);
      }
    }

    addTestResult('✅ Диагностика завершена');
  };

  const clearAll = () => {
    setImageUrl(null);
    setDocumentUrl(null);
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          <Icon name="upload" className="inline mr-2" />
          Тестирование загрузки файлов
        </h1>
        <p className="text-gray-600">
          Страница для тестирования интеграции с Yandex Object Storage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Загрузка изображений */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              <Icon name="image" className="inline mr-2" />
              Загрузка изображений
            </h2>
          </div>
          <CloudFileUpload
            value={imageUrl || undefined}
            onChange={(url) => setImageUrl(url)}
            accept="image/*"
            label="Выберите изображение"
            helperText="Поддерживаются JPG, PNG, GIF, WebP"
            siteId={1}
          />
          
          {imageUrl && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-700">Загруженное изображение:</p>
              <p className="text-xs text-gray-500 break-all">{imageUrl}</p>
            </div>
          )}
        </Card>

        {/* Загрузка документов */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              <Icon name="file" className="inline mr-2" />
              Загрузка документов
            </h2>
          </div>
          <CloudFileUpload
            value={documentUrl || undefined}
            onChange={(url) => setDocumentUrl(url)}
            accept=".pdf,.doc,.docx,.txt"
            label="Выберите документ"
            helperText="Поддерживаются PDF, DOC, DOCX, TXT"
            siteId={1}
          />
          
          {documentUrl && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-700">Загруженный документ:</p>
              <p className="text-xs text-gray-500 break-all">{documentUrl}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Панель управления */}
      <Card className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            <Icon name="settings" className="inline mr-2" />
            Панель управления
          </h2>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={runDiagnostics}
            disabled={!imageUrl && !documentUrl}
            variant="primary"
          >
            <Icon name="search" className="mr-2" />
            Запустить диагностику
          </Button>
          
          <Button
            onClick={clearAll}
            variant="secondary"
          >
            <Icon name="refresh" className="mr-2" />
            Очистить все
          </Button>
        </div>
      </Card>

      {/* Результаты тестирования */}
      {testResults.length > 0 && (
        <Card className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              <Icon name="code" className="inline mr-2" />
              Результаты диагностики
            </h2>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Информация о настройках */}
      <Card className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            <Icon name="info" className="inline mr-2" />
            Информация о настройках
          </h2>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Backend URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</p>
          <p><strong>Bucket:</strong> adminifuw.storage.yandexcloud.net</p>
          <p><strong>Структура папок:</strong> sites/{'{site_id}'}/uploads/</p>
          <p><strong>Поддерживаемые форматы:</strong> Изображения, документы, видео, архивы</p>
        </div>
      </Card>
    </div>
  );
};

export default TestFileUpload; 
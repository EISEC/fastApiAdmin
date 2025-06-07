import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SocialNetworks from '../components/ui/SocialNetworks';
import { useSettings } from '../hooks/useSettings';

/**
 * Тестовая страница для проверки социальных сетей
 */
const TestSocialNetworks: React.FC = () => {
  const { socialNetworks, getSocialNetworks, isLoading } = useSettings();

  return (
    <DashboardLayout title="Тест социальных сетей">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Тестирование социальных сетей
          </h1>
        </div>

        {/* Информация о загрузке */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Статус загрузки</h2>
          <p>Загрузка: {isLoading ? 'Да' : 'Нет'}</p>
          <p>Всего сетей: {socialNetworks.length}</p>
          <p>Активных сетей: {getSocialNetworks(true).length}</p>
        </div>

        {/* Данные социальных сетей */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Данные социальных сетей</h2>
          {socialNetworks.length > 0 ? (
            <div className="space-y-2">
              {socialNetworks.map((network) => (
                <div key={network.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{network.social_name}</span>
                    <span className="ml-2 text-sm text-gray-500">({network.name})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Иконка: {network.icon_name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      network.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {network.is_enabled ? 'Активна' : 'Неактивна'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Социальные сети не загружены</p>
          )}
        </div>

        {/* Тестирование компонента SocialNetworks */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Компонент SocialNetworks</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Маленькие иконки (горизонтально)</h3>
              <SocialNetworks size="sm" direction="horizontal" />
            </div>

            <div>
              <h3 className="font-medium mb-2">Средние иконки с названиями</h3>
              <SocialNetworks size="md" direction="horizontal" showLabels />
            </div>

            <div>
              <h3 className="font-medium mb-2">Большие иконки (вертикально)</h3>
              <SocialNetworks size="lg" direction="vertical" showLabels />
            </div>

            <div>
              <h3 className="font-medium mb-2">Ограничение до 2 сетей</h3>
              <SocialNetworks size="md" direction="horizontal" limit={2} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestSocialNetworks; 
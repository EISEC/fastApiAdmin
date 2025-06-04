import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Icon, { iconMap, type AvailableIconName, type IconSize, type IconColor } from '../components/ui/Icon';
import Card from '../components/ui/Card';

/**
 * Страница демонстрации иконок с поиском и фильтрацией
 */
const IconsDemo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<IconSize>('lg');
  const [selectedColor, setSelectedColor] = useState<IconColor>('current');

  // Категории иконок
  const categories = {
    all: 'Все иконки',
    basic: 'Основные',
    users: 'Пользователи', 
    actions: 'Действия',
    files: 'Файлы',
    web: 'Веб',
    communication: 'Коммуникация',
    media: 'Медиа',
    status: 'Статус',
    navigation: 'Навигация',
    time: 'Время',
    security: 'Безопасность',
    finance: 'Финансы',
    social: 'Социальные',
    location: 'Местоположение',
    misc: 'Прочее',
  };

  // Мапинг иконок по категориям
  const iconCategories: Record<string, AvailableIconName[]> = {
    basic: ['home', 'dashboard', 'menu', 'close', 'search', 'settings'],
    users: ['user', 'users', 'userAdd', 'userRemove', 'userEdit'],
    actions: ['add', 'edit', 'delete', 'copy', 'share', 'download', 'upload', 'refresh', 'filter'],
    files: ['file', 'folder', 'image', 'video', 'pdf', 'fileZip'],
    web: ['globe', 'link', 'browser', 'code'],
    communication: ['mail', 'message', 'notification'],
    media: ['play', 'pause', 'stop', 'camera'],
    status: ['check', 'cancel', 'alert', 'info', 'question', 'warning'],
    navigation: ['arrowUp', 'arrowDown', 'arrowLeft', 'arrowRight'],
    time: ['calendar', 'clock'],
    security: ['lock', 'eye', 'eyeOff'],
    finance: ['creditCard', 'money'],
    social: ['favourite', 'star'],
    location: ['location', 'map'],
    misc: ['fire', 'logout'],
    system: ['wifi', 'bluetooth', 'printer'],
  };

  // Все иконки
  const allIcons = Object.keys(iconMap) as AvailableIconName[];

  // Фильтрация иконок
  const filteredIcons = useMemo(() => {
    let icons = selectedCategory === 'all' ? allIcons : iconCategories[selectedCategory] || [];
    
    if (searchTerm) {
      icons = icons.filter(icon => 
        icon.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return icons;
  }, [searchTerm, selectedCategory, allIcons]);

  const copyIconCode = (iconName: AvailableIconName) => {
    const code = `<Icon name="${iconName}" size="${selectedSize}" color="${selectedColor}" />`;
    navigator.clipboard.writeText(code);
    // Можно добавить toast уведомление
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Система иконок</h1>
          <p className="mt-2 text-sm text-gray-700">
            Демонстрация иконок HugeIcons. Всего доступно {allIcons.length} иконок.
          </p>
        </div>

        {/* Панель управления */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Поиск */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Поиск иконок
                </label>
                <div className="relative">
                  <Icon 
                    name="search" 
                    size="sm" 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Введите название иконки..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Категория */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(categories).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Размер */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Размер
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value as IconSize)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="xs">XS (12px)</option>
                  <option value="sm">SM (16px)</option>
                  <option value="md">MD (20px)</option>
                  <option value="lg">LG (24px)</option>
                  <option value="xl">XL (32px)</option>
                  <option value="2xl">2XL (48px)</option>
                </select>
              </div>

              {/* Цвет */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цвет
                </label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value as IconColor)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="current">Текущий</option>
                  <option value="primary">Основной</option>
                  <option value="secondary">Вторичный</option>
                  <option value="success">Успех</option>
                  <option value="warning">Предупреждение</option>
                  <option value="danger">Опасность</option>
                  <option value="gray">Серый</option>
                </select>
              </div>
            </div>

            {/* Информация */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Найдено: <span className="font-semibold">{filteredIcons.length}</span> иконок
                {searchTerm && (
                  <span className="ml-2">
                    по запросу "<span className="font-medium">{searchTerm}</span>"
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Сетка иконок */}
        <Card>
          <div className="p-6">
            {filteredIcons.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="search" size="2xl" className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Иконки не найдены
                </h3>
                <p className="text-gray-500">
                  Попробуйте изменить условия поиска или выберите другую категорию.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {filteredIcons.map((iconName) => (
                  <div
                    key={iconName}
                    className="group relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => copyIconCode(iconName)}
                    title={`Нажмите чтобы скопировать код`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                        <Icon 
                          name={iconName} 
                          size={selectedSize} 
                          color={selectedColor}
                        />
                      </div>
                      <div className="text-xs text-gray-600 text-center font-mono">
                        {iconName}
                      </div>
                    </div>
                    
                    {/* Overlay при hover */}
                    <div className="absolute inset-0 bg-blue-50 bg-opacity-0 group-hover:bg-opacity-90 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-xs text-blue-600 font-medium">
                        Копировать код
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Документация */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Использование
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Базовое использование:</h4>
                <pre className="bg-gray-50 p-3 rounded-md text-sm font-mono">
{`import { Icon } from '../components/ui';

<Icon name="home" size="md" color="primary" />`}
                </pre>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Доступные свойства:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">name</code> - название иконки (обязательно)</li>
                  <li><code className="bg-gray-100 px-1 rounded">size</code> - размер: xs, sm, md, lg, xl, 2xl</li>
                  <li><code className="bg-gray-100 px-1 rounded">color</code> - цвет: primary, secondary, success, warning, danger, gray, white, current</li>
                  <li><code className="bg-gray-100 px-1 rounded">strokeWidth</code> - толщина обводки (по умолчанию 1.5)</li>
                  <li><code className="bg-gray-100 px-1 rounded">className</code> - дополнительные CSS классы</li>
                  <li><code className="bg-gray-100 px-1 rounded">onClick</code> - обработчик клика</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IconsDemo; 
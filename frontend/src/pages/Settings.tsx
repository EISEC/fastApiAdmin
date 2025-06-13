import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useSitesStore } from '../store/sitesStore';
import type { SettingCategory } from '../types/settings.types';
import DashboardLayout from '../components/layout/DashboardLayout';
import SettingsTabs from '../components/settings/SettingsTabs';
import SettingsGroup from '../components/settings/SettingsGroup';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { getIconName } from '../utils/iconMapping';

/**
 * Главная страница настроек (только для суперадминистраторов)
 */
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { currentSite } = useSitesStore();
  const {
    // Состояние
    categories,
    currentCategory,
    changedSettings,
    validationErrors,
    isLoading: isSettingsLoading,
    isSaving,
    error,
    lastSaved,
    hasUnsavedChanges,
    
    // Действия
    fetchSettings,
    fetchCategories,
    updateSetting,
    saveAllSettings,
    resetCategory,
    resetAllSettings,
    setCurrentCategory,
    validateAll,
    exportSettings,
    importSettings,
    clearErrors
  } = useSettingsStore();

  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  // Проверка доступа - только для суперадминистраторов
  useEffect(() => {
    // Ждем завершения загрузки авторизации
    if (isLoading) return;
    
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (user.role.name !== 'superuser') {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate, isLoading]);

  // Загрузка данных при монтировании
  useEffect(() => {
    // Загружаем данные только если пользователь суперадминистратор
    if (isAuthenticated && user && user.role.name === 'superuser') {
      const loadData = async () => {
        await fetchSettings();
        await fetchCategories();
      };
      
      loadData();
    }
  }, [fetchSettings, fetchCategories, isAuthenticated, user]);

  // Для отладки: выводим категории после загрузки
  useEffect(() => {
    console.log('categories:', categories);
  }, [categories]);

  // Предупреждение о несохраненных изменениях при уходе со страницы
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Проверяем права доступа
  if (!isAuthenticated || !user || user.role.name !== 'superuser') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Icon name="shield" size="2xl" color="danger" className="mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Нет доступа
            </h2>
            <p className="text-gray-600 mb-4">
              Настройки системы доступны только суперадминистраторам
            </p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/dashboard')}
            >
              Вернуться к панели управления
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentCategoryData = categories.find(cat => cat.id === currentCategory);

  const handleSaveAll = async () => {
    const isValid = validateAll();
    if (isValid) {
      await saveAllSettings();
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportSettings([currentCategory]);
      
      // Создаем и скачиваем файл
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-${currentCategory}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка экспорта:', err);
    }
  };

  const handleImport = async () => {
    try {
      await importSettings(importData);
      setShowImportModal(false);
      setImportData('');
    } catch (err) {
      console.error('Ошибка импорта:', err);
    }
  };

  if (isSettingsLoading && categories.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок страницы */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  <Icon name="settings" size="lg" className="inline mr-2" />
                  Настройки системы
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Управление конфигурацией приложения (только для суперадминистраторов)
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {lastSaved && (
                  <span className="text-sm text-gray-500">
                    Последнее сохранение: {new Date(lastSaved).toLocaleString('ru')}
                  </span>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  disabled={isSettingsLoading}
                >
                  <Icon name="download" size="sm" className="mr-2" />
                  Экспорт
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  disabled={isSettingsLoading}
                >
                  <Icon name="upload" size="sm" className="mr-2" />
                  Импорт
                </Button>

                {hasUnsavedChanges && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetAllSettings}
                      disabled={isSaving}
                    >
                      <Icon name="refresh" size="sm" className="mr-2" />
                      Сбросить все
                    </Button>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveAll}
                      disabled={isSaving}
                      loading={isSaving}
                    >
                      <Icon name="check" size="sm" className="mr-2" />
                      Сохранить все
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name="alert" size="sm" color="danger" />
                <span className="text-sm font-medium text-red-800">
                  {error}
                </span>
              </div>
              <button
                onClick={clearErrors}
                className="text-red-600 hover:text-red-700"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
          </div>
        )}

        {/* Навигация по категориям */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <SettingsTabs
            categories={categories}
            currentCategory={currentCategory}
            onChange={setCurrentCategory}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>

        {/* Контент */}
        <div className="space-y-6">
          {currentCategoryData ? (
            <>
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2 mb-4">
                  <Icon name={getIconName(currentCategoryData.icon)} size="md" />
                  <span>{currentCategoryData.name}</span>
                </h2>
                {currentCategoryData.description && (
                  <p className="text-gray-600 mb-6">
                    {currentCategoryData.description}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                {currentCategoryData.groups.map((group) => {
                  const groupChangedSettings = group.settings.reduce((acc, setting) => {
                    if (changedSettings[setting.key] !== undefined) {
                      acc[setting.key] = changedSettings[setting.key];
                    }
                    return acc;
                  }, {} as Record<string, any>);

                  const hasGroupChanges = Object.keys(groupChangedSettings).length > 0;

                  return (
                    <SettingsGroup
                      key={group.id}
                      group={group}
                      values={{ ...group.settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}), ...changedSettings }}
                      errors={validationErrors}
                      onChange={updateSetting}
                      onSave={handleSaveAll}
                      onReset={() => resetCategory(currentCategory)}
                      isLoading={isSaving}
                      hasChanges={hasGroupChanges}
                      siteId={currentSite?.id}
                    />
                  );
                })}
              </div>

              {currentCategoryData.groups.length === 0 && (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12">
                  <div className="text-center">
                    <Icon name="settings" size="2xl" color="gray" className="mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Настройки не найдены
                    </h3>
                    <p className="text-gray-600">
                      В данной категории пока нет доступных настроек
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12">
              <div className="text-center">
                <Icon name="search" size="2xl" color="gray" className="mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Категория не найдена
                </h3>
                <p className="text-gray-600">
                  Выбранная категория настроек не существует
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Модальное окно импорта */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Импорт настроек
                </h3>
              </div>
              
              <div className="px-6 py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Вставьте JSON данные для импорта настроек:
                </p>
                
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Вставьте JSON данные..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData('');
                  }}
                >
                  Отмена
                </Button>
                
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={!importData.trim() || isSaving}
                  loading={isSaving}
                >
                  Импортировать
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings; 
import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { SettingCategory } from '../types/settings.types';
import DashboardLayout from '../components/layout/DashboardLayout';
import SettingsTabs from '../components/settings/SettingsTabs';
import SettingsGroup from '../components/settings/SettingsGroup';
import Button from '../components/ui/Button';

/**
 * Главная страница настроек
 */
const Settings: React.FC = () => {
  const {
    // Состояние
    categories,
    currentCategory,
    changedSettings,
    validationErrors,
    isLoading,
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

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      await fetchSettings();
      await fetchCategories();
    };
    
    loadData();
  }, [fetchSettings, fetchCategories]);

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

  if (isLoading && categories.length === 0) {
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
                  ⚙️ Настройки системы
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Управление конфигурацией приложения
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
                  disabled={isLoading}
                >
                  📥 Экспорт
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  disabled={isLoading}
                >
                  📤 Импорт
                </Button>

                {hasUnsavedChanges && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetAllSettings}
                      disabled={isSaving}
                    >
                      ↺ Сбросить все
                    </Button>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveAll}
                      disabled={isSaving}
                      loading={isSaving}
                    >
                      💾 Сохранить все
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
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-800">
                  {error}
                </span>
              </div>
              <button
                onClick={clearErrors}
                className="text-red-600 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                  <span>{currentCategoryData.icon}</span>
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
                    />
                  );
                })}
              </div>

              {currentCategoryData.groups.length === 0 && (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">⚙️</div>
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
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
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
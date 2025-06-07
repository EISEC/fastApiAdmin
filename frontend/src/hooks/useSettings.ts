import { useEffect } from 'react';
import { useGlobalSettings } from '../store/globalSettingsStore';

interface Setting {
  key: string;
  value: any;
  type: string;
  label: string;
}

interface SocialNetwork {
  id: string;
  name: string;
  social_name: string;
  url: string;
  icon_name: string;
  order: number;
  is_enabled: boolean;
}

interface UseSettingsReturn {
  // Общие настройки
  getSetting: (key: string, defaultValue?: any) => any;
  settings: Record<string, any>;
  isLoading: boolean;
  
  // Социальные сети
  socialNetworks: SocialNetwork[];
  getSocialNetworks: (enabledOnly?: boolean) => SocialNetwork[];
  
  // Часто используемые настройки
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  themeMode: string;
  
  // Методы
  refetch: () => Promise<void>;
}

/**
 * Хук для работы с настройками приложения
 * Теперь использует глобальный store для избежания дублирующих запросов
 */
export const useSettings = (): UseSettingsReturn => {
  const {
    settings,
    socialNetworks,
    isSettingsLoading,
    isSocialLoading,
    settingsLoaded,
    socialLoaded,
    loadAll,
    getSetting: getGlobalSetting,
    getSocialNetworks: getGlobalSocialNetworks,
    getSiteName,
    getSiteDescription,
    getAdminEmail,
    getThemeMode
  } = useGlobalSettings();

  // Загружаем данные при первом использовании
  useEffect(() => {
    if (!settingsLoaded || !socialLoaded) {
      loadAll();
    }
  }, [loadAll, settingsLoaded, socialLoaded]);

  // Получить настройку по ключу
  const getSetting = (key: string, defaultValue: any = null) => {
    return getGlobalSetting(key, defaultValue);
  };

  // Получить социальные сети
  const getSocialNetworks = (enabledOnly: boolean = true) => {
    return getGlobalSocialNetworks(enabledOnly);
  };

  return {
    // Общие настройки
    getSetting,
    settings,
    isLoading: isSettingsLoading || isSocialLoading,
    
    // Социальные сети
    socialNetworks,
    getSocialNetworks,
    
    // Часто используемые настройки
    siteName: getSiteName(),
    siteDescription: getSiteDescription(),
    adminEmail: getAdminEmail(),
    themeMode: getThemeMode(),
    
    // Методы
    refetch: loadAll,
  };
};

export default useSettings; 
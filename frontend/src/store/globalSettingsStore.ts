import { create } from 'zustand';
import { api } from '../lib/axios.config';

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

interface GlobalSettingsState {
  // Настройки
  settings: Record<string, any>;
  isSettingsLoading: boolean;
  settingsError: string | null;
  settingsLoaded: boolean;
  
  // Социальные сети
  socialNetworks: SocialNetwork[];
  isSocialLoading: boolean;
  socialError: string | null;
  socialLoaded: boolean;
  
  // Действия
  loadSettings: () => Promise<void>;
  loadSocialNetworks: () => Promise<void>;
  loadAll: () => Promise<void>;
  
  // Хелперы
  getSetting: (key: string, defaultValue?: any) => any;
  getSocialNetworks: (enabledOnly?: boolean) => SocialNetwork[];
  
  // Часто используемые
  getSiteName: () => string;
  getSiteDescription: () => string;
  getAdminEmail: () => string;
  getThemeMode: () => string;
  
  // Сброс
  reset: () => void;
}

export const useGlobalSettings = create<GlobalSettingsState>((set, get) => ({
  // Начальное состояние
  settings: {},
  isSettingsLoading: false,
  settingsError: null,
  settingsLoaded: false,
  
  socialNetworks: [],
  isSocialLoading: false,
  socialError: null,
  socialLoaded: false,
  
  // Загрузка настроек
  loadSettings: async () => {
    const state = get();
    if (state.settingsLoaded || state.isSettingsLoading) {
      return; // Уже загружены или загружаются
    }
    
    set({ isSettingsLoading: true, settingsError: null });
    
    try {
      const response = await api.get<Setting[]>('/settings/all/');
      
      // Преобразуем в объект
      const settingsObj: Record<string, any> = {};
      response.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      
      set({ 
        settings: settingsObj,
        settingsLoaded: true,
        settingsError: null
      });
    } catch (error: any) {
      console.error('Ошибка загрузки настроек:', error);
      set({ 
        settings: {},
        settingsLoaded: true, // Помечаем как загруженные даже при ошибке
        settingsError: error.response?.data?.detail || 'Ошибка загрузки настроек'
      });
    } finally {
      set({ isSettingsLoading: false });
    }
  },
  
  // Загрузка социальных сетей
  loadSocialNetworks: async () => {
    const state = get();
    if (state.socialLoaded || state.isSocialLoading) {
      return; // Уже загружены или загружаются
    }
    
    set({ isSocialLoading: true, socialError: null });
    
    try {
      const response = await api.get<SocialNetwork[]>('/settings/social-networks/public_list/');
      
      set({ 
        socialNetworks: response,
        socialLoaded: true,
        socialError: null
      });
    } catch (error: any) {
      console.warn('Ошибка загрузки социальных сетей:', error);
      set({ 
        socialNetworks: [],
        socialLoaded: true, // Помечаем как загруженные даже при ошибке
        socialError: error.response?.data?.detail || 'Ошибка загрузки социальных сетей'
      });
    } finally {
      set({ isSocialLoading: false });
    }
  },
  
  // Загрузка всех данных
  loadAll: async () => {
    const { loadSettings, loadSocialNetworks } = get();
    await Promise.all([
      loadSettings(),
      loadSocialNetworks()
    ]);
  },
  
  // Получить настройку
  getSetting: (key: string, defaultValue: any = null) => {
    const { settings } = get();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  },
  
  // Получить социальные сети
  getSocialNetworks: (enabledOnly: boolean = true) => {
    const { socialNetworks } = get();
    if (enabledOnly) {
      return socialNetworks.filter(network => network.is_enabled);
    }
    return socialNetworks;
  },
  
  // Часто используемые настройки
  getSiteName: () => {
    const { getSetting } = get();
    return getSetting('site_name', 'FastAPI Admin');
  },
  
  getSiteDescription: () => {
    const { getSetting } = get();
    return getSetting('site_description', '');
  },
  
  getAdminEmail: () => {
    const { getSetting } = get();
    return getSetting('admin_email', 'admin@example.com');
  },
  
  getThemeMode: () => {
    const { getSetting } = get();
    return getSetting('theme_mode', 'light');
  },
  
  // Сброс состояния
  reset: () => {
    set({
      settings: {},
      isSettingsLoading: false,
      settingsError: null,
      settingsLoaded: false,
      socialNetworks: [],
      isSocialLoading: false,
      socialError: null,
      socialLoaded: false,
    });
  }
})); 
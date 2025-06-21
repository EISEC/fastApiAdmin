import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useSitesStore } from '../../store/sitesStore';
import { useDynamicModelsStore } from '../../store/dynamicModelsStore';
import Icon, { type AvailableIconName } from '../ui/Icon';
import SocialNetworks from '../ui/SocialNetworks';

interface NavigationItem {
  name: string;
  href: string;
  icon: AvailableIconName;
  roles: string[];
}

/**
 * Навигационные пункты меню
 */
const navigationItems: NavigationItem[] = [
  {
    name: 'Дашборд',
    href: '/',
    icon: 'dashboard',
    roles: ['superuser', 'admin', 'author'],
  },
  {
    name: 'Сайты',
    href: '/sites',
    icon: 'globe',
    roles: ['superuser', 'admin'],
  },
  {
    name: 'Посты',
    href: '/posts',
    icon: 'edit',
    roles: ['superuser', 'admin', 'author'],
  },
  {
    name: 'Страницы',
    href: '/pages',
    icon: 'file',
    roles: ['superuser', 'admin', 'author'],
  },
  {
    name: 'Медиа-библиотека',
    href: '/media',
    icon: 'folder',
    roles: ['superuser', 'admin', 'author'],
  },
  {
    name: 'Пользователи',
    href: '/users',
    icon: 'users',
    roles: ['superuser', 'admin'],
  },
  {
    name: 'Динамические модели',
    href: '/dynamic-models',
    icon: 'database',
    roles: ['superuser', 'admin'],
  },
  {
    name: 'Импорт и экспорт',
    href: '/import-export',
    icon: 'upload',
    roles: ['superuser', 'admin'],
  },
  {
    name: 'Настройки',
    href: '/settings',
    icon: 'settings',
    roles: ['superuser', 'admin'],
  },
  {
    name: 'Иконки',
    href: '/icons',
    icon: 'star',
    roles: ['superuser', 'admin', 'author'],
  },
  {
    name: 'Тест соцсетей',
    href: '/test-social-networks',
    icon: 'mobile',
    roles: ['superuser', 'admin', 'author'],
  },
  {
    name: 'Диагностика',
    href: '/debug',
    icon: 'bug',
    roles: ['superuser'], // Только для суперадмина
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * Компонент боковой панели навигации
 */
const Sidebar: React.FC<SidebarProps> = ({ 
  isMobileOpen = false, 
  onMobileClose 
}) => {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const { sites, fetchSites } = useSitesStore();
  const { models, fetchModels } = useDynamicModelsStore();
  const location = useLocation();
  
  // Состояние для выпадающих списков
  const [expandedSites, setExpandedSites] = useState<number[]>([]);
  
  // Получаем роль пользователя
  const userRole = user?.role?.name;
  
  // Загружаем данные при монтировании
  useEffect(() => {
    if (isAuthenticated && userRole && ['superuser', 'admin', 'author'].includes(userRole)) {
      fetchSites();
      fetchModels();
    }
  }, [isAuthenticated, userRole, fetchSites, fetchModels]);
  
  // Фильтрация пунктов меню по ролям
  const allowedItems = navigationItems.filter(item => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });
  
  // Группировка динамических моделей по сайтам
  const modelsBySite = models.reduce((acc, model) => {
    if (!acc[model.site]) {
      acc[model.site] = [];
    }
    acc[model.site].push(model);
    return acc;
  }, {} as Record<number, typeof models>);
  
  // Сайты с динамическими моделями
  const sitesWithModels = sites.filter(site => 
    modelsBySite[site.id] && modelsBySite[site.id].length > 0
  );
  
  // Переключение развернутого состояния сайта
  const toggleSiteExpansion = (siteId: number) => {
    setExpandedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };
  
  // Обработчик выхода
  const handleLogout = () => {
    logout();
    if (onMobileClose) onMobileClose();
  };
  
  if (isLoading) {
    return (
      <div className={clsx(
        'fixed inset-y-0 left-0 flex w-64 flex-col bg-white border-r border-gray-200 z-40',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            FastAPI Admin
          </h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const SidebarContent = () => (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar panel */}
      <div className={clsx(
        'fixed inset-y-0 left-0 flex w-64 flex-col bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            FastAPI Admin
          </h1>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <span className="sr-only">Закрыть меню</span>
            <Icon name="close" size="lg" />
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex flex-1 flex-col">
            <nav className="space-y-1 px-2">
              {allowedItems.length > 0 ? (
                allowedItems.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href));
                  
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => {
                        if (onMobileClose) onMobileClose();
                      }}
                      className={clsx(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <span className="mr-3">
                        <Icon name={item.icon} size="md" />
                      </span>
                      {item.name}
                    </NavLink>
                  );
                })
              ) : (
                <div className="px-2 py-4 text-sm text-gray-500">
                  {userRole ? (
                    <>
                      <p>Роль: {userRole}</p>
                      <p>Нет доступных пунктов меню</p>
                    </>
                  ) : (
                    <p>Роль не определена</p>
                  )}
                </div>
              )}
            </nav>

            {/* Сайты с динамическими моделями */}
            {sitesWithModels.length > 0 && (
              <div className="mt-6 px-2">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Динамические модели сайтов
                </h3>
                <nav className="space-y-1">
                  {sitesWithModels.map((site) => {
                    const siteModels = modelsBySite[site.id] || [];
                    const isExpanded = expandedSites.includes(site.id);
                    
                    return (
                      <div key={site.id}>
                        {/* Заголовок сайта */}
                        <button
                          onClick={() => toggleSiteExpansion(site.id)}
                          className="w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <div className="flex items-center">
                            <span className="mr-3">
                              <Icon name="globe" size="sm" />
                            </span>
                            <span className="truncate">{site.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                              {siteModels.length}
                            </span>
                            <Icon 
                              name={isExpanded ? "arrowUp" : "arrowDown"} 
                              size="sm" 
                              className="text-gray-400"
                            />
                          </div>
                        </button>
                        
                        {/* Динамические модели сайта */}
                        {isExpanded && (
                          <div className="ml-6 space-y-1">
                            {siteModels.map((model) => {
                              const modelPath = `/dynamic-models/${model.id}/data`;
                              const isModelActive = location.pathname.startsWith(modelPath);
                              
                              return (
                                <NavLink
                                  key={model.id}
                                  to={modelPath}
                                  onClick={() => {
                                    if (onMobileClose) onMobileClose();
                                  }}
                                  className={clsx(
                                    'group flex items-center px-2 py-1.5 text-sm rounded-md transition-colors',
                                    isModelActive
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  )}
                                >
                                  <span className="mr-2">
                                    <Icon name="database" size="xs" />
                                  </span>
                                  <span className="truncate">
                                    {model.display_name || model.name}
                                  </span>
                                  {model.data_entries_count !== undefined && (
                                    <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                                      {model.data_entries_count}
                                    </span>
                                  )}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
          
          {/* User info and logout */}
          <div className="border-t border-gray-200 pt-4 px-2">
            <div className="flex items-center px-2 py-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-medium">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user.username
                  }
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role?.name || 'Пользователь'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full mt-2 group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <span className="mr-3">
                <Icon name="logout" size="md" />
              </span>
              Выйти
            </button>
            
                         {/* Социальные сети */}
             <div className="mt-4">
               <SocialNetworks />
             </div>
          </div>
        </div>
      </div>
    </>
  );
  
  return <SidebarContent />;
};

export default Sidebar; 
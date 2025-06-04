import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import Icon, { type AvailableIconName } from '../ui/Icon';

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
  const location = useLocation();
  
  // Получаем роль пользователя
  const userRole = user?.role?.name;
  
  // Фильтрация пунктов меню по ролям
  const allowedItems = navigationItems.filter(item => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });
  
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
          </div>
        </div>
        
        {/* User info */}
        <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar}
                    alt={user.username}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.first_name?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.username
                  }
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role?.name || 'Неизвестная роль'}
                </p>
              </div>
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Выйти"
            >
              <Icon name="logout" size="md" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
  
  return <SidebarContent />;
};

export default Sidebar; 
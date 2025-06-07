import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useSettings } from '../../hooks/useSettings';
import { useGlobalSettings } from '../../store/globalSettingsStore';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/**
 * Основной макет дашборда с сайдбаром и хедером
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className = '',
  title,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { siteName } = useSettings();
  const { loadAll, settingsLoaded, socialLoaded } = useGlobalSettings();

  // Инициализируем глобальные настройки при первой загрузке
  useEffect(() => {
    if (!settingsLoaded || !socialLoaded) {
      loadAll();
    }
  }, [loadAll, settingsLoaded, socialLoaded]);

  // Обновляем заголовок документа
  useEffect(() => {
    const pageTitle = title ? `${title} - ${siteName}` : siteName;
    document.title = pageTitle;
  }, [title, siteName]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={handleMobileMenuClose}
      />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onMobileMenuToggle={handleMobileMenuToggle} />
        
        {/* Page content */}
        <main className={clsx('py-6 px-4 sm:px-6 lg:px-8', className)}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 
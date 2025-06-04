import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FileManager } from '../components/files';
import Icon from '../components/ui/Icon';

const MediaLibrary: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Icon name="folder" size="lg" className="mr-2" />
              Медиа-библиотека
            </h1>
          </div>
          <p className="text-gray-600">
            Управление файлами и медиа-контентом для всех сайтов
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-250px)]">
          <FileManager />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MediaLibrary; 
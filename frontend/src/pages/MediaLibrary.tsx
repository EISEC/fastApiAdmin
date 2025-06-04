import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FileManager } from '../components/files';

const MediaLibrary: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📁 Медиа-библиотека
          </h1>
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
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import SitesTable from '../components/tables/SitesTable';
import Button from '../components/ui/Button';
import { useSitesStore } from '../store';

/**
 * Страница управления сайтами
 */
const Sites: React.FC = () => {
  const navigate = useNavigate();
  const { fetchSites, sites } = useSitesStore();

  // Загружаем сайты при монтировании
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление сайтами</h1>
            <p className="mt-2 text-sm text-gray-700">
              Создавайте и управляйте вашими сайтами. Всего сайтов: {sites.length}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => navigate('/sites/create')}
            >
              + Создать сайт
            </Button>
          </div>
        </div>

        {/* Sites Table */}
        <SitesTable />
      </div>
    </DashboardLayout>
  );
};

export default Sites; 
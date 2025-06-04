import React, { useEffect } from 'react';
import { useSitesStore } from '../../store';
import Icon from './Icon';

interface SiteFilterProps {
  selectedSiteId?: number | null;
  onSiteChange: (siteId: number | null) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Компонент фильтрации по сайтам
 */
const SiteFilter: React.FC<SiteFilterProps> = ({
  selectedSiteId,
  onSiteChange,
  className = '',
  placeholder = 'Все сайты'
}) => {
  const { sites, fetchSites, isLoading } = useSitesStore();

  // Загружаем сайты при монтировании
  useEffect(() => {
    if (sites.length === 0) {
      fetchSites();
    }
  }, [fetchSites, sites.length]);

  const handleSiteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onSiteChange(value === '' ? null : parseInt(value, 10));
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedSiteId || ''}
        onChange={handleSiteChange}
        disabled={isLoading}
        className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>
      
      {/* Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon name="globe" size="sm" color="gray" />
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
          <Icon name="refresh" size="sm" className="animate-spin" />
        </div>
      )}
      
      {/* Clear button */}
      {selectedSiteId && (
        <button
          onClick={() => onSiteChange(null)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
};

export default SiteFilter; 
import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import Icon from './Icon';

interface SocialNetworksProps {
  /** Размер иконок */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Вертикальное или горизонтальное расположение */
  direction?: 'horizontal' | 'vertical';
  /** Показывать названия соц.сетей */
  showLabels?: boolean;
  /** Дополнительные CSS классы */
  className?: string;
  /** Ограничить количество отображаемых сетей */
  limit?: number;
}

/**
 * Компонент для отображения ссылок на социальные сети
 */
const SocialNetworks: React.FC<SocialNetworksProps> = ({
  size = 'md',
  direction = 'horizontal',
  showLabels = false,
  className = '',
  limit,
}) => {
  const { getSocialNetworks, isLoading } = useSettings();
  
  const socialNetworks = getSocialNetworks(true); // Только активные
  const displayNetworks = limit ? socialNetworks.slice(0, limit) : socialNetworks;

  if (isLoading) {
    return (
      <div className={`flex ${direction === 'horizontal' ? 'flex-row space-x-3' : 'flex-col space-y-3'} ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`animate-pulse bg-gray-200 rounded-full ${
              size === 'xs' ? 'h-6 w-6' :
              size === 'sm' ? 'h-8 w-8' :
              size === 'md' ? 'h-10 w-10' :
              size === 'lg' ? 'h-12 w-12' :
              size === 'xl' ? 'h-16 w-16' :
              'h-20 w-20'
            }`}
          />
        ))}
      </div>
    );
  }

  if (displayNetworks.length === 0) {
    return null;
  }

  return (
    <div className={`flex ${direction === 'horizontal' ? 'flex-row space-x-3' : 'flex-col space-y-3'} ${className}`}>
      {displayNetworks.map((network) => (
        <a
          key={network.name}
          href={network.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 ${
            showLabels && direction === 'horizontal' ? 'space-x-2' : ''
          } ${
            showLabels && direction === 'vertical' ? 'space-y-1' : ''
          }`}
          title={network.social_name}
        >
          <div className="flex-shrink-0">
            <Icon 
              name={network.icon_name as any} 
              size={size} 
              className="hover:scale-110 transition-transform duration-200"
            />
          </div>
          
          {showLabels && (
            <span className={`text-sm font-medium ${direction === 'vertical' ? 'text-center' : ''}`}>
              {network.social_name}
            </span>
          )}
        </a>
      ))}
    </div>
  );
};

export default SocialNetworks; 
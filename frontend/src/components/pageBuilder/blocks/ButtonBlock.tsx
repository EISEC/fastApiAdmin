import React, { useState } from 'react';
import type { BlockConfig, ButtonBlockData } from '../../../types';

interface ButtonBlockProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Блок кнопки с возможностью редактирования
 */
const ButtonBlock: React.FC<ButtonBlockProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate
}) => {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const buttonData = block.data as ButtonBlockData;

  const handleTextChange = (text: string) => {
    onUpdate?.({
      data: { ...buttonData, text }
    });
  };

  const handleVariantChange = (variant: ButtonBlockData['variant']) => {
    onUpdate?.({
      data: { ...buttonData, variant }
    });
  };

  const handleSizeChange = (size: ButtonBlockData['size']) => {
    onUpdate?.({
      data: { ...buttonData, size }
    });
  };

  const handleHrefChange = (href: string) => {
    onUpdate?.({
      data: { ...buttonData, href }
    });
  };

  const getVariantClasses = () => {
    switch (buttonData.variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-900';
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white';
      case 'ghost':
        return 'text-blue-600 hover:bg-blue-50';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (buttonData.size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <div 
      className={`text-center ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      style={{ padding: block.styles?.padding || '16px' }}
    >
      {isEditingContent && isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={buttonData.text}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={() => setIsEditingContent(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingContent(false);
              }
            }}
            className="text-center border border-gray-300 rounded px-2 py-1"
            autoFocus
          />
          
          <div className="flex gap-2 justify-center">
            <select
              value={buttonData.variant}
              onChange={(e) => handleVariantChange(e.target.value as ButtonBlockData['variant'])}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="primary">Основная</option>
              <option value="secondary">Вторичная</option>
              <option value="outline">Контур</option>
              <option value="ghost">Прозрачная</option>
            </select>
            
            <select
              value={buttonData.size}
              onChange={(e) => handleSizeChange(e.target.value as ButtonBlockData['size'])}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="sm">Маленькая</option>
              <option value="md">Средняя</option>
              <option value="lg">Большая</option>
            </select>
          </div>
          
          <input
            type="url"
            value={buttonData.href || ''}
            onChange={(e) => handleHrefChange(e.target.value)}
            placeholder="Ссылка (необязательно)"
            className="text-xs text-center border border-gray-300 rounded px-2 py-1 w-full"
          />
        </div>
      ) : (
        <button
          className={`${getVariantClasses()} ${getSizeClasses()} rounded-lg transition-colors font-medium`}
          onClick={(e) => {
            if (isEditing) {
              e.preventDefault();
              setIsEditingContent(true);
            } else if (buttonData.href) {
              window.open(buttonData.href, '_blank');
            }
          }}
        >
          {buttonData.icon && <span className="mr-2">{buttonData.icon}</span>}
          {buttonData.text || 'Кнопка'}
        </button>
      )}
      
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
          🔘 Кнопка
        </div>
      )}
    </div>
  );
};

export default ButtonBlock; 
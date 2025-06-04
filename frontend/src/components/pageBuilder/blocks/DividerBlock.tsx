import React, { useState } from 'react';
import type { BlockConfig, DividerBlockData } from '../../../types';

interface DividerBlockProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Блок разделителя для создания горизонтальных линий
 */
const DividerBlock: React.FC<DividerBlockProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate
}) => {
  const [isEditingStyle, setIsEditingStyle] = useState(false);
  const dividerData = block.data as DividerBlockData;

  const handleStyleChange = (style: DividerBlockData['style']) => {
    onUpdate?.({
      data: { ...dividerData, style }
    });
  };

  const handleColorChange = (color: string) => {
    onUpdate?.({
      data: { ...dividerData, color }
    });
  };

  const handleWidthChange = (width: string) => {
    onUpdate?.({
      data: { ...dividerData, width }
    });
  };

  const presetColors = [
    { name: 'Серый', value: '#e5e7eb' },
    { name: 'Черный', value: '#374151' },
    { name: 'Синий', value: '#3b82f6' },
    { name: 'Красный', value: '#ef4444' },
    { name: 'Зеленый', value: '#10b981' },
    { name: 'Фиолетовый', value: '#8b5cf6' }
  ];

  const presetWidths = ['25%', '50%', '75%', '100%'];

  return (
    <div 
      className={`relative ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      style={{ padding: block.styles?.padding || '16px' }}
      onClick={() => {
        if (isEditing && !isEditingStyle) {
          setIsEditingStyle(true);
        }
      }}
    >
      {isEditingStyle && isEditing ? (
        <div className="flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg border space-y-4">
            <div className="text-sm font-medium text-gray-700">
              Настройки разделителя
            </div>
            
            {/* Стиль линии */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Стиль</label>
              <div className="flex gap-2">
                {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => {
                      handleStyleChange(style);
                    }}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      dividerData.style === style
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {style === 'solid' ? 'Сплошная' : 
                     style === 'dashed' ? 'Пунктир' : 'Точки'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Цвет */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Цвет</label>
              <div className="grid grid-cols-3 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      dividerData.color === color.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Ширина */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Ширина</label>
              <div className="flex gap-2">
                {presetWidths.map((width) => (
                  <button
                    key={width}
                    onClick={() => handleWidthChange(width)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      dividerData.width === width
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {width}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditingStyle(false)}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ minHeight: '24px' }}>
          <hr 
            style={{
              borderStyle: dividerData.style || 'solid',
              borderColor: dividerData.color || '#e5e7eb',
              width: dividerData.width || '100%',
              borderWidth: '1px 0 0 0',
              margin: 0
            }}
          />
          {isSelected && isEditing && (
            <div className="absolute text-xs text-blue-500 bg-white px-2 py-1 rounded shadow">
              нажмите для настройки
            </div>
          )}
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
          ➖ Разделитель
        </div>
      )}
    </div>
  );
};

export default DividerBlock; 
import React from 'react';
import type { BlockConfig, ImageBlockData } from '../../../types/pageBuilder.types';

interface ImageBlockProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Компонент блока изображения
 */
const ImageBlock: React.FC<ImageBlockProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate
}) => {
  const data = block.data as ImageBlockData;
  const styles = block.styles || {};

  const handleDataChange = (field: keyof ImageBlockData, value: string | number) => {
    if (onUpdate) {
      onUpdate({
        data: { ...data, [field]: value }
      });
    }
  };

  const getInlineStyles = () => ({
    backgroundColor: styles.backgroundColor || 'transparent',
    padding: styles.padding || '16px',
    margin: styles.margin || '0',
    border: styles.border || 'none',
    borderRadius: styles.borderRadius || '0',
    textAlign: styles.textAlign || 'center'
  });

  if (isEditing && isSelected) {
    return (
      <div 
        className={`relative ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        style={getInlineStyles()}
      >
        <div className="space-y-3">
          {/* URL изображения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL изображения:
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={data.src}
              onChange={(e) => handleDataChange('src', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Альтернативный текст */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Альтернативный текст:
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={data.alt}
              onChange={(e) => handleDataChange('alt', e.target.value)}
              placeholder="Описание изображения"
            />
          </div>

          {/* Подпись */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подпись (опционально):
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={data.caption || ''}
              onChange={(e) => handleDataChange('caption', e.target.value)}
              placeholder="Подпись к изображению"
            />
          </div>

          {/* Настройки отображения */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ширина (px):
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={data.width || ''}
                onChange={(e) => handleDataChange('width', Number(e.target.value))}
                placeholder="авто"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Высота (px):
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={data.height || ''}
                onChange={(e) => handleDataChange('height', Number(e.target.value))}
                placeholder="авто"
              />
            </div>
          </div>

          {/* Object fit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Масштабирование:
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={data.objectFit || 'cover'}
              onChange={(e) => handleDataChange('objectFit', e.target.value)}
            >
              <option value="cover">Обрезать (cover)</option>
              <option value="contain">Вместить (contain)</option>
              <option value="fill">Растянуть (fill)</option>
            </select>
          </div>

          {/* Превью изображения */}
          {data.src && (
            <div className="mt-4">
              <img
                src={data.src}
                alt={data.alt}
                className="max-w-full h-auto rounded-lg shadow-sm"
                style={{
                  width: data.width ? `${data.width}px` : 'auto',
                  height: data.height ? `${data.height}px` : 'auto',
                  objectFit: data.objectFit || 'cover'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {data.caption && (
                <p className="text-sm text-gray-600 mt-2 text-center italic">
                  {data.caption}
                </p>
              )}
            </div>
          )}
        </div>
        
        {isSelected && (
          <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
            🖼️ Изображение
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      style={getInlineStyles()}
    >
      {data.src ? (
        <div>
          <img
            src={data.src}
            alt={data.alt}
            className="max-w-full h-auto rounded-lg shadow-sm"
            style={{
              width: data.width ? `${data.width}px` : 'auto',
              height: data.height ? `${data.height}px` : 'auto',
              objectFit: data.objectFit || 'cover'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          {data.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">
              {data.caption}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <span className="text-4xl text-gray-400">🖼️</span>
            <p className="text-sm text-gray-500 mt-1">Нет изображения</p>
          </div>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
          🖼️ Изображение
        </div>
      )}
    </div>
  );
};

export default ImageBlock; 
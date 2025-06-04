import React, { useState } from 'react';
import type { BlockConfig, GalleryBlockData } from '../../../types';

interface GalleryBlockProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Блок галереи изображений
 */
const GalleryBlock: React.FC<GalleryBlockProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate
}) => {
  const [isEditingGallery, setIsEditingGallery] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const galleryData = block.data as GalleryBlockData;

  const handleLayoutChange = (layout: GalleryBlockData['layout']) => {
    onUpdate?.({
      data: { ...galleryData, layout }
    });
  };

  const handleColumnsChange = (columns: number) => {
    onUpdate?.({
      data: { ...galleryData, columns }
    });
  };

  const handleAddImage = () => {
    const newImage = {
      id: `img_${Date.now()}`,
      src: 'https://via.placeholder.com/300x200',
      alt: 'Новое изображение',
      caption: ''
    };

    onUpdate?.({
      data: {
        ...galleryData,
        images: [...(galleryData.images || []), newImage]
      }
    });
  };

  const handleUpdateImage = (imageId: string, updates: Partial<GalleryBlockData['images'][0]>) => {
    const updatedImages = (galleryData.images || []).map(img =>
      img.id === imageId ? { ...img, ...updates } : img
    );

    onUpdate?.({
      data: { ...galleryData, images: updatedImages }
    });
  };

  const handleDeleteImage = (imageId: string) => {
    const updatedImages = (galleryData.images || []).filter(img => img.id !== imageId);
    onUpdate?.({
      data: { ...galleryData, images: updatedImages }
    });
  };

  const getGridClasses = () => {
    const columns = galleryData.columns || 3;
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      case 5: return 'grid-cols-5';
      default: return 'grid-cols-3';
    }
  };

  return (
    <div 
      className={`${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      style={{ padding: block.styles?.padding || '16px' }}
    >
      {isEditingGallery && isEditing ? (
        <div className="space-y-4 bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-700">
            Настройки галереи
          </div>
          
          {/* Тип макета */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Макет</label>
            <div className="flex gap-2">
              {(['grid', 'masonry', 'carousel'] as const).map((layout) => (
                <button
                  key={layout}
                  onClick={() => handleLayoutChange(layout)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    galleryData.layout === layout
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {layout === 'grid' ? 'Сетка' : 
                   layout === 'masonry' ? 'Кладка' : 'Карусель'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Количество колонок */}
          {galleryData.layout === 'grid' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Колонки ({galleryData.columns || 3})
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={galleryData.columns || 3}
                onChange={(e) => handleColumnsChange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          {/* Изображения */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-600">
                Изображения
              </label>
              <button
                onClick={handleAddImage}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                + Добавить изображение
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(galleryData.images || []).map((image) => (
                <div key={image.id} className="p-3 border border-gray-200 rounded-lg">
                  {editingImage === image.id ? (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={image.src}
                        onChange={(e) => handleUpdateImage(image.id, { src: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                        placeholder="URL изображения"
                      />
                      
                      <input
                        type="text"
                        value={image.alt}
                        onChange={(e) => handleUpdateImage(image.id, { alt: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                        placeholder="Описание (alt)"
                      />
                      
                      <input
                        type="text"
                        value={image.caption || ''}
                        onChange={(e) => handleUpdateImage(image.id, { caption: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                        placeholder="Подпись (необязательно)"
                      />
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingImage(null)}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Готово
                        </button>
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer flex items-center gap-3"
                      onClick={() => setEditingImage(image.id)}
                    >
                      <img 
                        src={image.src} 
                        alt={image.alt}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-700">
                          {image.alt}
                        </div>
                        {image.caption && (
                          <div className="text-xs text-gray-500 mt-1">
                            {image.caption}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setIsEditingGallery(false)}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Готово
          </button>
        </div>
      ) : (
        <div
          onClick={() => {
            if (isEditing) {
              setIsEditingGallery(true);
            }
          }}
        >
          {(galleryData.images || []).length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <span className="text-gray-400 text-4xl block mb-2">🖼️</span>
              <p className="text-gray-500 text-sm">
                Галерея пуста
              </p>
              {isEditing && (
                <p className="text-blue-500 text-xs mt-2">
                  Нажмите для добавления изображений
                </p>
              )}
            </div>
          ) : (
            <div className={`grid ${getGridClasses()} gap-4`}>
              {galleryData.images.map((image) => (
                <div key={image.id} className="group relative">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
                  />
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                      <p className="text-sm">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isSelected && isEditing && (galleryData.images || []).length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-xs text-blue-500 bg-white px-2 py-1 rounded shadow inline-block">
                нажмите для настройки галереи
              </div>
            </div>
          )}
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
          🖼️ Галерея
        </div>
      )}
    </div>
  );
};

export default GalleryBlock; 
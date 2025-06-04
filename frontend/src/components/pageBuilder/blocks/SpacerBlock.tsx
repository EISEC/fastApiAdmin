import React, { useState } from 'react';
import type { BlockConfig, SpacerBlockData } from '../../../types';

interface SpacerBlockProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Блок отступа для создания пространства между элементами
 */
const SpacerBlock: React.FC<SpacerBlockProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate
}) => {
  const [isEditingHeight, setIsEditingHeight] = useState(false);
  const spacerData = block.data as SpacerBlockData;

  const handleHeightChange = (height: number) => {
    onUpdate?.({
      data: { ...spacerData, height }
    });
  };

  const presetHeights = [10, 20, 40, 60, 80, 100, 120, 160, 200];

  return (
    <div 
      className={`relative ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50 bg-gray-50' : ''}`}
      style={{ height: `${spacerData.height || 40}px` }}
      onClick={() => {
        if (isEditing && !isEditingHeight) {
          setIsEditingHeight(true);
        }
      }}
    >
      {(isSelected || isEditingHeight) && (
        <div className="flex items-center justify-center h-full">
          {isEditingHeight && isEditing ? (
            <div className="bg-white p-3 rounded-lg shadow-lg border">
              <div className="text-xs font-medium text-gray-700 mb-2">
                Высота отступа (px)
              </div>
              
              {/* Быстрые пресеты */}
              <div className="grid grid-cols-3 gap-1 mb-3">
                {presetHeights.map((height) => (
                  <button
                    key={height}
                    onClick={() => {
                      handleHeightChange(height);
                      setIsEditingHeight(false);
                    }}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      spacerData.height === height
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {height}px
                  </button>
                ))}
              </div>
              
              {/* Кастомное значение */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={spacerData.height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 40)}
                  onBlur={() => setIsEditingHeight(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingHeight(false);
                    }
                  }}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  min="10"
                  max="500"
                  autoFocus
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <span>📏</span>
              <span>Отступ {spacerData.height || 40}px</span>
              {isEditing && (
                <span className="text-xs text-blue-500">(нажмите для изменения)</span>
              )}
            </div>
          )}
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
          📏 Отступ
        </div>
      )}
    </div>
  );
};

export default SpacerBlock; 
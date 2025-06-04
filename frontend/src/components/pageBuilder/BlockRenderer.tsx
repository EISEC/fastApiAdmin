import React from 'react';
import type { BlockConfig } from '../../types';
import Icon from '../ui/Icon';

// Импорт блоков
import TextBlock from './blocks/TextBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ImageBlock from './blocks/ImageBlock';
import ButtonBlock from './blocks/ButtonBlock';
import SpacerBlock from './blocks/SpacerBlock';
import DividerBlock from './blocks/DividerBlock';
import FormBlock from './blocks/FormBlock';
import GalleryBlock from './blocks/GalleryBlock';

interface BlockRendererProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/**
 * Универсальный рендерер блоков
 */
const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown
}) => {
  const renderBlock = () => {
    const commonProps = {
      block,
      isSelected,
      isEditing,
      onUpdate
    };

    switch (block.type) {
      case 'text':
        return <TextBlock {...commonProps} />;
      
      case 'heading':
        return <HeadingBlock {...commonProps} />;
      
      case 'image':
        return <ImageBlock {...commonProps} />;
      
      case 'button':
        return <ButtonBlock {...commonProps} />;
      
      case 'spacer':
        return <SpacerBlock {...commonProps} />;
      
      case 'divider':
        return <DividerBlock {...commonProps} />;
      
      case 'gallery':
        return <GalleryBlock {...commonProps} />;
      
      case 'form':
        return <FormBlock {...commonProps} />;
      
      default:
        return (
          <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
            Неизвестный тип блока: {block.type}
          </div>
        );
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected ? 'z-10' : ''
      }`}
      onClick={handleClick}
    >
      {renderBlock()}
      
      {/* Панель инструментов */}
      {isSelected && isEditing && (
        <div className="absolute -top-12 right-0 flex items-center gap-1 bg-white border border-gray-300 rounded-lg shadow-lg p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.();
            }}
            className="p-1 hover:bg-gray-100 rounded text-xs"
            title="Переместить вверх"
          >
            <Icon name="arrowUp" size="xs" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.();
            }}
            className="p-1 hover:bg-gray-100 rounded text-xs"
            title="Переместить вниз"
          >
            <Icon name="arrowDown" size="xs" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.();
            }}
            className="p-1 hover:bg-gray-100 rounded text-xs"
            title="Дублировать"
          >
            <Icon name="copy" size="xs" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-1 hover:bg-red-100 text-red-600 rounded text-xs"
            title="Удалить"
          >
            <Icon name="delete" size="xs" color="danger" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BlockRenderer; 
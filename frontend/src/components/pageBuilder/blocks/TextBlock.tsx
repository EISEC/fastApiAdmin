import React from 'react';
import type { BlockConfig, TextBlockData } from '../../../types/pageBuilder.types';
import Icon from '../../ui/Icon';

interface TextBlockProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Компонент текстового блока
 */
const TextBlock: React.FC<TextBlockProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate
}) => {
  const data = block.data as TextBlockData;
  const styles = block.styles || {};

  const handleContentChange = (newContent: string) => {
    if (onUpdate) {
      onUpdate({
        data: { ...data, content: newContent }
      });
    }
  };

  const getInlineStyles = () => ({
    backgroundColor: styles.backgroundColor || 'transparent',
    color: styles.textColor || 'inherit',
    fontSize: styles.fontSize || '16px',
    padding: styles.padding || '16px',
    margin: styles.margin || '0',
    border: styles.border || 'none',
    borderRadius: styles.borderRadius || '0',
    textAlign: styles.textAlign || 'left'
  });

  const Tag = data.tag || 'p';

  if (isEditing && isSelected) {
    return (
      <div 
        className={`relative ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        style={getInlineStyles()}
      >
        <textarea
          className="w-full min-h-[60px] bg-transparent border-none outline-none resize-none"
          value={data.content}
          onChange={(e) => handleContentChange(e.target.value)}
          onBlur={() => {/* Сохранение изменений */}}
          placeholder="Введите ваш текст..."
          autoFocus
        />
        {isSelected && (
          <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded flex items-center">
            <Icon name="edit" size="xs" className="mr-1" />
            Текст
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      style={getInlineStyles()}
    >
      <Tag 
        className="break-words"
        dangerouslySetInnerHTML={{ __html: data.content || 'Пустой текстовый блок' }}
      />
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded flex items-center">
          <Icon name="edit" size="xs" className="mr-1" />
          Текст
        </div>
      )}
    </div>
  );
};

export default TextBlock; 
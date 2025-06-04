import React from 'react';
import type { BlockConfig, HeadingBlockData } from '../../../types/pageBuilder.types';

interface HeadingBlockProps {
  block: BlockConfig;
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Компонент блока заголовка
 */
const HeadingBlock: React.FC<HeadingBlockProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate
}) => {
  const data = block.data as HeadingBlockData;
  const styles = block.styles || {};

  const handleContentChange = (newContent: string) => {
    if (onUpdate) {
      onUpdate({
        data: { ...data, content: newContent }
      });
    }
  };

  const handleLevelChange = (newLevel: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (onUpdate) {
      onUpdate({
        data: { ...data, level: newLevel }
      });
    }
  };

  const getInlineStyles = () => ({
    backgroundColor: styles.backgroundColor || 'transparent',
    color: styles.textColor || 'inherit',
    padding: styles.padding || '16px',
    margin: styles.margin || '0',
    border: styles.border || 'none',
    borderRadius: styles.borderRadius || '0',
    textAlign: styles.textAlign || 'left'
  });

  const Tag = `h${data.level || 2}` as keyof JSX.IntrinsicElements;

  if (isEditing && isSelected) {
    return (
      <div 
        className={`relative ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        style={getInlineStyles()}
      >
        <div className="flex items-center gap-2 mb-2">
          <select
            value={data.level || 2}
            onChange={(e) => handleLevelChange(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
            <option value={5}>H5</option>
            <option value={6}>H6</option>
          </select>
        </div>
        <input
          type="text"
          className="w-full bg-transparent border-none outline-none text-inherit font-bold"
          style={{ 
            fontSize: data.level === 1 ? '2.25rem' : 
                     data.level === 2 ? '1.875rem' : 
                     data.level === 3 ? '1.5rem' : 
                     data.level === 4 ? '1.25rem' : 
                     data.level === 5 ? '1.125rem' : '1rem'
          }}
          value={data.content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Введите заголовок..."
          autoFocus
        />
        {isSelected && (
          <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
            📰 Заголовок H{data.level || 2}
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
      <Tag className="break-words font-bold">
        {data.content || 'Пустой заголовок'}
      </Tag>
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
          📰 Заголовок H{data.level || 2}
        </div>
      )}
    </div>
  );
};

export default HeadingBlock; 
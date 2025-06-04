import React from 'react';
import { usePageBuilderStore, blockTemplates } from '../../store/pageBuilderStore';
import type { BlockType, BlockConfig } from '../../types';
import BlockRenderer from './BlockRenderer';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Icon from '../ui/Icon';

interface PageBuilderProps {
  className?: string;
}

/**
 * Основной компонент конструктора страниц
 */
const PageBuilder: React.FC<PageBuilderProps> = ({ className = '' }) => {
  const {
    blocks,
    selectedBlockId,
    previewMode,
    addBlock,
    updateBlock,
    deleteBlock,
    selectBlock,
    duplicateBlock,
    moveBlock,
    setPreviewMode,
    clearBlocks,
    exportBlocks,
    importBlocks
  } = usePageBuilderStore();

  const handleAddBlock = (blockType: BlockType) => {
    addBlock(blockType);
  };

  const handleBlockSelect = (blockId: string) => {
    selectBlock(blockId);
  };

  const handleBlockUpdate = (blockId: string, updates: Partial<BlockConfig>) => {
    updateBlock(blockId, updates);
  };

  const handleBlockDelete = (blockId: string) => {
    if (confirm('Удалить этот блок?')) {
      deleteBlock(blockId);
    }
  };

  const handleBlockDuplicate = (blockId: string) => {
    duplicateBlock(blockId);
  };

  const handleBlockMoveUp = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.position > 0) {
      moveBlock(blockId, block.position - 1);
    }
  };

  const handleBlockMoveDown = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.position < blocks.length - 1) {
      moveBlock(blockId, block.position + 1);
    }
  };

  const handleExport = () => {
    const blocksJson = exportBlocks();
    navigator.clipboard.writeText(blocksJson);
    alert('Блоки скопированы в буфер обмена!');
  };

  const handleImport = () => {
    const json = prompt('Вставьте JSON с блоками:');
    if (json) {
      importBlocks(json);
    }
  };

  const sortedBlocks = blocks.sort((a, b) => a.position - b.position);

  // Группировка шаблонов по категориям
  const groupedTemplates = blockTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof blockTemplates>);

  const categoryNames = {
    content: 'Контент',
    media: 'Медиа',
    layout: 'Макет',
    interactive: 'Интерактивные'
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Левая панель с блоками */}
      {!previewMode && (
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Конструктор страниц
            </h3>
            
            {/* Управляющие кнопки */}
            <div className="flex flex-col gap-2 mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewMode(true)}
                className="w-full"
              >
                <Icon name="eye" size="sm" className="mr-2" />
                Превью
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  className="flex-1"
                >
                  <Icon name="upload" size="sm" className="mr-2" />
                  Экспорт
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleImport}
                  className="flex-1"
                >
                  <Icon name="download" size="sm" className="mr-2" />
                  Импорт
                </Button>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm('Очистить все блоки?')) {
                    clearBlocks();
                  }
                }}
                className="w-full"
              >
                <Icon name="delete" size="sm" className="mr-2" />
                Очистить
              </Button>
            </div>
          </div>

          {/* Библиотека блоков */}
          <div className="p-4 space-y-4">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {categoryNames[category as keyof typeof categoryNames]}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.type}
                      onClick={() => handleAddBlock(template.type)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center justify-center mb-1">
                        <Icon name={template.icon as any} size="lg" color="gray" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Рабочая область */}
      <div className="flex-1 overflow-y-auto">
        {/* Верхняя панель */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {previewMode ? 'Превью страницы' : 'Редактор страницы'}
            </h2>
            <div className="text-sm text-gray-500">
              Блоков: {blocks.length}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {previewMode ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                <Icon name="edit" size="sm" className="mr-2" />
                Редактировать
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewMode(true)}
              >
                <Icon name="eye" size="sm" className="mr-2" />
                Превью
              </Button>
            )}
          </div>
        </div>

        {/* Область с блоками */}
        <div 
          className="min-h-screen p-6"
          onClick={() => selectBlock(null)}
        >
          {blocks.length === 0 ? (
            <Card className="max-w-md mx-auto text-center py-12">
              <Icon name="edit" size="2xl" className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Начните создание страницы
              </h3>
              <p className="text-gray-500 mb-4">
                Выберите блок из левой панели или добавьте свой первый элемент
              </p>
              {!previewMode && (
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddBlock('heading')}
                  >
                    <Icon name="edit" size="sm" className="mr-2" />
                    Заголовок
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddBlock('text')}
                  >
                    <Icon name="edit" size="sm" className="mr-2" />
                    Текст
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto space-y-1">
              {sortedBlocks.map((block) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  isEditing={!previewMode}
                  onUpdate={(updates) => handleBlockUpdate(block.id, updates)}
                  onSelect={() => handleBlockSelect(block.id)}
                  onDelete={() => handleBlockDelete(block.id)}
                  onDuplicate={() => handleBlockDuplicate(block.id)}
                  onMoveUp={() => handleBlockMoveUp(block.id)}
                  onMoveDown={() => handleBlockMoveDown(block.id)}
                />
              ))}
              
              {/* Зона для добавления нового блока в конец */}
              {!previewMode && (
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <p className="text-gray-500 mb-4">
                    Добавить новый блок в конец страницы
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddBlock('text')}
                    >
                      <Icon name="edit" size="sm" className="mr-2" />
                      Текст
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddBlock('image')}
                    >
                      <Icon name="image" size="sm" className="mr-2" />
                      Изображение
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddBlock('button')}
                    >
                      <Icon name="add" size="sm" className="mr-2" />
                      Кнопка
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageBuilder; 
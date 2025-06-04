import { create } from 'zustand';
import type { 
  BlockConfig, 
  BlockType, 
  PageBuilderState, 
  PageBuilderActions,
  BlockTemplate
} from '../types/pageBuilder.types';

interface PageBuilderStore extends PageBuilderState, PageBuilderActions {
  // Дополнительные методы
  getBlockById: (blockId: string) => BlockConfig | undefined;
  getBlocksByType: (blockType: BlockType) => BlockConfig[];
  getNextPosition: () => number;
  generateBlockId: () => string;
  exportBlocks: () => string;
  importBlocks: (blocksJson: string) => void;
}

// Шаблоны блоков по умолчанию
export const blockTemplates: BlockTemplate[] = [
  {
    type: 'text',
    name: 'Текст',
    description: 'Обычный текстовый блок',
    icon: 'edit',
    category: 'content',
    defaultData: {
      content: 'Введите ваш текст здесь...',
      tag: 'p'
    },
    defaultStyles: {
      padding: '16px',
      fontSize: '16px'
    }
  },
  {
    type: 'heading',
    name: 'Заголовок',
    description: 'Заголовок любого уровня',
    icon: 'edit',
    category: 'content',
    defaultData: {
      content: 'Заголовок страницы',
      level: 2
    },
    defaultStyles: {
      padding: '16px',
      textAlign: 'left'
    }
  },
  {
    type: 'image',
    name: 'Изображение',
    description: 'Картинка с настройками',
    icon: 'image',
    category: 'media',
    defaultData: {
      src: 'https://via.placeholder.com/600x400',
      alt: 'Описание изображения',
      caption: '',
      objectFit: 'cover'
    },
    defaultStyles: {
      padding: '16px',
      textAlign: 'center'
    }
  },
  {
    type: 'button',
    name: 'Кнопка',
    description: 'Интерактивная кнопка',
    icon: 'add',
    category: 'interactive',
    defaultData: {
      text: 'Нажмите здесь',
      href: '#',
      variant: 'primary',
      size: 'md'
    },
    defaultStyles: {
      padding: '16px',
      textAlign: 'center'
    }
  },
  {
    type: 'spacer',
    name: 'Отступ',
    description: 'Пустое пространство',
    icon: 'edit',
    category: 'layout',
    defaultData: {
      height: 40
    }
  },
  {
    type: 'divider',
    name: 'Разделитель',
    description: 'Линия-разделитель',
    icon: 'edit',
    category: 'layout',
    defaultData: {
      style: 'solid',
      color: '#e5e7eb',
      width: '100%'
    },
    defaultStyles: {
      padding: '16px'
    }
  },
  {
    type: 'gallery',
    name: 'Галерея',
    description: 'Коллекция изображений',
    icon: 'image',
    category: 'media',
    defaultData: {
      images: [
        {
          id: '1',
          src: 'https://via.placeholder.com/300x200',
          alt: 'Изображение 1'
        },
        {
          id: '2',
          src: 'https://via.placeholder.com/300x200',
          alt: 'Изображение 2'
        }
      ],
      layout: 'grid',
      columns: 3
    },
    defaultStyles: {
      padding: '16px'
    }
  },
  {
    type: 'form',
    name: 'Форма',
    description: 'Форма для ввода данных',
    icon: 'edit',
    category: 'interactive',
    defaultData: {
      title: 'Контактная форма',
      submitText: 'Отправить',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Имя',
          placeholder: 'Введите ваше имя',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Введите ваш email',
          required: true
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Сообщение',
          placeholder: 'Введите ваше сообщение',
          required: false
        }
      ]
    },
    defaultStyles: {
      padding: '24px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px'
    }
  }
];

export const usePageBuilderStore = create<PageBuilderStore>((set, get) => ({
  // Состояние
  blocks: [],
  selectedBlockId: null,
  draggedBlockId: null,
  isEditing: true,
  previewMode: false,

  // Действия
  addBlock: (blockType: BlockType, position?: number) => {
    const state = get();
    const template = blockTemplates.find(t => t.type === blockType);
    
    if (!template) {
      console.error(`Template for block type ${blockType} not found`);
      return;
    }

    const newBlock: BlockConfig = {
      id: state.generateBlockId(),
      type: blockType,
      position: position ?? state.getNextPosition(),
      data: { ...template.defaultData },
      styles: { ...template.defaultStyles },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
    };

    set(state => {
      const blocks = [...state.blocks];
      
      if (position !== undefined) {
        // Вставляем в определенную позицию
        blocks.splice(position, 0, newBlock);
        // Обновляем позиции всех последующих блоков
        blocks.forEach((block, index) => {
          block.position = index;
        });
      } else {
        // Добавляем в конец
        blocks.push(newBlock);
      }
      
      return {
        blocks,
        selectedBlockId: newBlock.id
      };
    });
  },

  updateBlock: (blockId: string, updates: Partial<BlockConfig>) => {
    set(state => ({
      blocks: state.blocks.map(block =>
        block.id === blockId
          ? {
              ...block,
              ...updates,
              metadata: {
                createdAt: block.metadata?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: block.metadata ? block.metadata.version + 1 : 1
              }
            }
          : block
      )
    }));
  },

  deleteBlock: (blockId: string) => {
    set(state => {
      const blocks = state.blocks
        .filter(block => block.id !== blockId)
        .map((block, index) => ({ ...block, position: index }));
      
      return {
        blocks,
        selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId
      };
    });
  },

  moveBlock: (blockId: string, newPosition: number) => {
    set(state => {
      const blocks = [...state.blocks];
      const blockIndex = blocks.findIndex(block => block.id === blockId);
      
      if (blockIndex === -1) return state;
      
      const [movedBlock] = blocks.splice(blockIndex, 1);
      blocks.splice(newPosition, 0, movedBlock);
      
      // Обновляем позиции всех блоков
      blocks.forEach((block, index) => {
        block.position = index;
      });
      
      return { blocks };
    });
  },

  selectBlock: (blockId: string | null) => {
    set({ selectedBlockId: blockId });
  },

  setPreviewMode: (enabled: boolean) => {
    set({ 
      previewMode: enabled,
      selectedBlockId: enabled ? null : get().selectedBlockId
    });
  },

  duplicateBlock: (blockId: string) => {
    const state = get();
    const block = state.getBlockById(blockId);
    
    if (!block) return;
    
    const duplicatedBlock: BlockConfig = {
      ...block,
      id: state.generateBlockId(),
      position: block.position + 1,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
    };
    
    set(state => {
      const blocks = [...state.blocks];
      blocks.splice(block.position + 1, 0, duplicatedBlock);
      
      // Обновляем позиции всех последующих блоков
      blocks.forEach((block, index) => {
        block.position = index;
      });
      
      return {
        blocks,
        selectedBlockId: duplicatedBlock.id
      };
    });
  },

  clearBlocks: () => {
    set({
      blocks: [],
      selectedBlockId: null,
      draggedBlockId: null
    });
  },

  // Вспомогательные методы
  getBlockById: (blockId: string) => {
    return get().blocks.find(block => block.id === blockId);
  },

  getBlocksByType: (blockType: BlockType) => {
    return get().blocks.filter(block => block.type === blockType);
  },

  getNextPosition: () => {
    const blocks = get().blocks;
    return blocks.length;
  },

  generateBlockId: () => {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  exportBlocks: () => {
    const { blocks } = get();
    return JSON.stringify(blocks, null, 2);
  },

  importBlocks: (blocksJson: string) => {
    try {
      const blocks = JSON.parse(blocksJson) as BlockConfig[];
      
      // Валидация импортированных блоков
      const validBlocks = blocks.filter(block => 
        block.id && 
        block.type && 
        typeof block.position === 'number' &&
        block.data
      );
      
      set({
        blocks: validBlocks,
        selectedBlockId: null
      });
    } catch (error) {
      console.error('Error importing blocks:', error);
    }
  }
})); 
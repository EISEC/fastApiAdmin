export interface BlockConfig {
  id: string;
  type: BlockType;
  position: number;
  data: TextBlockData | HeadingBlockData | ImageBlockData | ButtonBlockData | FormBlockData | GalleryBlockData | SpacerBlockData | DividerBlockData | EmbedBlockData | ColumnsBlockData;
  styles?: BlockStyles;
  metadata?: BlockMetadata;
}

export type BlockType = 
  | 'text'
  | 'heading'
  | 'image'
  | 'button'
  | 'form'
  | 'gallery'
  | 'spacer'
  | 'divider'
  | 'embed'
  | 'columns';

export interface BlockStyles {
  className?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  padding?: string;
  margin?: string;
  border?: string;
  borderRadius?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface BlockMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Конкретные типы данных для разных блоков
export interface TextBlockData {
  content: string;
  tag?: 'p' | 'span' | 'div';
}

export interface HeadingBlockData {
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ImageBlockData {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export interface ButtonBlockData {
  text: string;
  href?: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  icon?: string;
}

export interface FormBlockData {
  title: string;
  fields: FormFieldConfig[];
  submitText: string;
  action?: string;
  method?: 'POST' | 'GET';
}

export interface FormFieldConfig {
  id: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface GalleryBlockData {
  images: {
    id: string;
    src: string;
    alt: string;
    caption?: string;
  }[];
  layout: 'grid' | 'masonry' | 'carousel';
  columns?: number;
}

export interface SpacerBlockData {
  height: number;
}

export interface DividerBlockData {
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  width: string;
}

export interface EmbedBlockData {
  embedCode: string;
  source: 'youtube' | 'vimeo' | 'custom';
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

export interface ColumnsBlockData {
  columns: {
    id: string;
    width: number; // процент от 100
    blocks: BlockConfig[];
  }[];
}

// Интерфейс для конструктора страниц
export interface PageBuilderState {
  blocks: BlockConfig[];
  selectedBlockId: string | null;
  draggedBlockId: string | null;
  isEditing: boolean;
  previewMode: boolean;
}

export interface PageBuilderActions {
  addBlock: (blockType: BlockType, position?: number) => void;
  updateBlock: (blockId: string, data: Partial<BlockConfig>) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, newPosition: number) => void;
  selectBlock: (blockId: string | null) => void;
  setPreviewMode: (enabled: boolean) => void;
  duplicateBlock: (blockId: string) => void;
  clearBlocks: () => void;
}

// Шаблоны блоков
export interface BlockTemplate {
  type: BlockType;
  name: string;
  description: string;
  icon: string;
  defaultData: TextBlockData | HeadingBlockData | ImageBlockData | ButtonBlockData | FormBlockData | GalleryBlockData | SpacerBlockData | DividerBlockData | EmbedBlockData | ColumnsBlockData;
  defaultStyles?: BlockStyles;
  category: 'content' | 'media' | 'layout' | 'interactive';
}
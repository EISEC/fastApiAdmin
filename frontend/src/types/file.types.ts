export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  path: string;
  url: string;
  type: FileType;
  mimeType: string;
  size: number;
  folderId?: string;
  metadata: FileMetadata;
  permissions: FilePermissions;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  children?: FolderItem[];
  filesCount: number;
  permissions: FilePermissions;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

export interface FileMetadata {
  title?: string;
  description?: string;
  altText?: string;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // для видео/аудио в секундах
  exif?: Record<string, any>; // EXIF данные для изображений
}

export interface FilePermissions {
  read: string[]; // массив ролей с правом чтения
  write: string[]; // массив ролей с правом записи
  delete: string[]; // массив ролей с правом удаления
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface FileFilter {
  type?: FileType[];
  folderId?: string;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sizeMin?: number;
  sizeMax?: number;
}

export interface FileSort {
  field: 'name' | 'size' | 'createdAt' | 'updatedAt' | 'type';
  direction: 'asc' | 'desc';
}

export interface FilesState {
  files: FileItem[];
  folders: FolderItem[];
  selectedFiles: string[];
  selectedFolder: string | null;
  currentPath: string;
  filter: FileFilter;
  sort: FileSort;
  viewMode: 'grid' | 'list';
  uploadProgress: UploadProgress[];
  isLoading: boolean;
  error: string | null;
}

export interface FilesActions {
  // Файлы
  fetchFiles: (folderId?: string) => Promise<void>;
  uploadFiles: (files: File[], folderId?: string) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<void>;
  updateFile: (fileId: string, updates: Partial<FileItem>) => Promise<void>;
  
  // Папки
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveFolder: (folderId: string, targetParentId?: string) => Promise<void>;
  updateFolder: (folderId: string, updates: Partial<FolderItem>) => Promise<void>;
  
  // Навигация и состояние
  selectFiles: (fileIds: string[]) => void;
  selectFolder: (folderId: string | null) => void;
  setCurrentPath: (path: string) => void;
  setFilter: (filter: Partial<FileFilter>) => void;
  setSort: (sort: FileSort) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  clearSelection: () => void;
  clearError: () => void;
}

// Утилитарные типы
export interface MediaPickerOptions {
  multiple?: boolean;
  accept?: FileType[];
  maxSize?: number; // в байтах
  onSelect: (files: FileItem[]) => void;
  onCancel?: () => void;
}

export interface FileUploadOptions {
  folderId?: string;
  maxSize?: number;
  allowedTypes?: string[];
  autoOptimize?: boolean;
  generateThumbnails?: boolean;
}

export interface ThumbnailSize {
  width: number;
  height: number;
  quality?: number;
}

// Константы для типов файлов
export const FILE_TYPE_EXTENSIONS: Record<FileType, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  other: []
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const THUMBNAIL_SIZES: Record<string, ThumbnailSize> = {
  small: { width: 150, height: 150, quality: 80 },
  medium: { width: 300, height: 300, quality: 85 },
  large: { width: 600, height: 600, quality: 90 }
}; 
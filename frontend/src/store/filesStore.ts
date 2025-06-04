import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  FilesState, 
  FilesActions, 
  FileItem, 
  FolderItem, 
  FileFilter, 
  FileSort,
  UploadProgress,
  FileType 
} from '../types';

// Моковые данные для демонстрации (в реальном проекте будет API)
const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'hero-banner.jpg',
    originalName: 'hero-banner.jpg',
    path: '/uploads/images/hero-banner.jpg',
    url: 'https://via.placeholder.com/800x400/4f46e5/ffffff?text=Hero+Banner',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 245760, // 240KB
    metadata: {
      title: 'Hero Banner',
      description: 'Главный баннер для сайта',
      altText: 'Красивый баннер с градиентом',
      tags: ['banner', 'hero', 'главная'],
      dimensions: { width: 800, height: 400 }
    },
    permissions: {
      read: ['all'],
      write: ['admin', 'editor'],
      delete: ['admin']
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: 'user1'
  },
  {
    id: '2',
    name: 'company-logo.png',
    originalName: 'company-logo.png',
    path: '/uploads/logos/company-logo.png',
    url: 'https://via.placeholder.com/200x100/1e40af/ffffff?text=Logo',
    type: 'image',
    mimeType: 'image/png',
    size: 45320, // 44KB
    folderId: 'folder-1',
    metadata: {
      title: 'Логотип компании',
      description: 'Основной логотип',
      altText: 'Логотип компании',
      tags: ['logo', 'brand'],
      dimensions: { width: 200, height: 100 }
    },
    permissions: {
      read: ['all'],
      write: ['admin'],
      delete: ['admin']
    },
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-10T14:20:00Z',
    createdBy: 'user1'
  },
  {
    id: '3',
    name: 'presentation.pdf',
    originalName: 'presentation.pdf',
    path: '/uploads/documents/presentation.pdf',
    url: '/uploads/documents/presentation.pdf',
    type: 'document',
    mimeType: 'application/pdf',
    size: 2048000, // 2MB
    folderId: 'folder-2',
    metadata: {
      title: 'Презентация компании',
      description: 'Основная презентация для клиентов',
      tags: ['presentation', 'company', 'client']
    },
    permissions: {
      read: ['admin', 'editor'],
      write: ['admin'],
      delete: ['admin']
    },
    createdAt: '2024-01-12T09:15:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
    createdBy: 'user2'
  }
];

const mockFolders: FolderItem[] = [
  {
    id: 'folder-1',
    name: 'Логотипы и бренд',
    path: '/uploads/logos',
    filesCount: 5,
    permissions: {
      read: ['all'],
      write: ['admin', 'editor'],
      delete: ['admin']
    },
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: 'user1'
  },
  {
    id: 'folder-2',
    name: 'Документы',
    path: '/uploads/documents',
    filesCount: 12,
    permissions: {
      read: ['admin', 'editor'],
      write: ['admin'],
      delete: ['admin']
    },
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
    createdBy: 'user1'
  },
  {
    id: 'folder-3',
    name: 'Галерея',
    path: '/uploads/gallery',
    parentId: 'folder-1',
    filesCount: 25,
    permissions: {
      read: ['all'],
      write: ['admin', 'editor', 'author'],
      delete: ['admin', 'editor']
    },
    createdAt: '2024-01-05T16:45:00Z',
    updatedAt: '2024-01-14T18:20:00Z',
    createdBy: 'user2'
  }
];

// Утилитарные функции
const getFileTypeFromMime = (mimeType: string): FileType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
  return 'other';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const simulateFileUpload = async (file: File, folderId?: string): Promise<FileItem> => {
  // Симуляция загрузки файла
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const fileType = getFileTypeFromMime(file.type);
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: fileId,
    name: file.name,
    originalName: file.name,
    path: `/uploads/${fileType}s/${file.name}`,
    url: URL.createObjectURL(file), // В реальном проекте будет URL с сервера
    type: fileType,
    mimeType: file.type,
    size: file.size,
    folderId,
    metadata: {
      title: file.name,
      description: '',
      altText: fileType === 'image' ? file.name : undefined,
      tags: [],
      dimensions: fileType === 'image' ? { width: 0, height: 0 } : undefined
    },
    permissions: {
      read: ['all'],
      write: ['admin', 'editor'],
      delete: ['admin']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'current-user'
  };
};

export const useFilesStore = create<FilesState & FilesActions>()(
  devtools(
    (set, get) => ({
      // State
      files: mockFiles,
      folders: mockFolders,
      selectedFiles: [],
      selectedFolder: null,
      currentPath: '/',
      filter: {},
      sort: { field: 'createdAt', direction: 'desc' },
      viewMode: 'grid',
      uploadProgress: [],
      isLoading: false,
      error: null,

      // Actions
      fetchFiles: async (folderId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Симуляция API вызова
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { filter } = get();
          let filteredFiles = mockFiles;
          
          // Фильтрация по папке
          if (folderId !== undefined) {
            filteredFiles = filteredFiles.filter(file => file.folderId === folderId);
          }
          
          // Применение других фильтров
          if (filter.type && filter.type.length > 0) {
            filteredFiles = filteredFiles.filter(file => filter.type!.includes(file.type));
          }
          
          if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            filteredFiles = filteredFiles.filter(file => 
              file.name.toLowerCase().includes(searchTerm) ||
              file.metadata.title?.toLowerCase().includes(searchTerm) ||
              file.metadata.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
          }
          
          set({ files: filteredFiles, isLoading: false });
        } catch (error) {
          set({ error: 'Ошибка загрузки файлов', isLoading: false });
        }
      },

      uploadFiles: async (files, folderId) => {
        const uploadPromises = files.map(async (file) => {
          const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Добавляем прогресс загрузки
          set(state => ({
            uploadProgress: [...state.uploadProgress, {
              fileId: uploadId,
              fileName: file.name,
              progress: 0,
              status: 'uploading'
            }]
          }));
          
          try {
            // Симуляция прогресса загрузки
            for (let progress = 0; progress <= 100; progress += 10) {
              await new Promise(resolve => setTimeout(resolve, 100));
              set(state => ({
                uploadProgress: state.uploadProgress.map(p => 
                  p.fileId === uploadId ? { ...p, progress } : p
                )
              }));
            }
            
            // Загрузка файла
            const uploadedFile = await simulateFileUpload(file, folderId);
            
            // Обновляем статус
            set(state => ({
              uploadProgress: state.uploadProgress.map(p => 
                p.fileId === uploadId ? { ...p, status: 'completed' } : p
              ),
              files: [...state.files, uploadedFile]
            }));
            
            // Удаляем прогресс через 2 секунды
            setTimeout(() => {
              set(state => ({
                uploadProgress: state.uploadProgress.filter(p => p.fileId !== uploadId)
              }));
            }, 2000);
            
          } catch (error) {
            set(state => ({
              uploadProgress: state.uploadProgress.map(p => 
                p.fileId === uploadId ? { ...p, status: 'error', error: 'Ошибка загрузки' } : p
              )
            }));
          }
        });
        
        await Promise.all(uploadPromises);
      },

      deleteFiles: async (fileIds) => {
        set({ isLoading: true });
        
        try {
          // Симуляция API вызова
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            files: state.files.filter(file => !fileIds.includes(file.id)),
            selectedFiles: state.selectedFiles.filter(id => !fileIds.includes(id)),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Ошибка удаления файлов', isLoading: false });
        }
      },

      moveFiles: async (fileIds, targetFolderId) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            files: state.files.map(file => 
              fileIds.includes(file.id) 
                ? { ...file, folderId: targetFolderId }
                : file
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Ошибка перемещения файлов', isLoading: false });
        }
      },

      updateFile: async (fileId, updates) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            files: state.files.map(file => 
              file.id === fileId 
                ? { ...file, ...updates, updatedAt: new Date().toISOString() }
                : file
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Ошибка обновления файла', isLoading: false });
        }
      },

      fetchFolders: async () => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          set({ folders: mockFolders, isLoading: false });
        } catch (error) {
          set({ error: 'Ошибка загрузки папок', isLoading: false });
        }
      },

      createFolder: async (name, parentId) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const newFolder: FolderItem = {
            id: `folder_${Date.now()}`,
            name,
            path: parentId ? `${mockFolders.find(f => f.id === parentId)?.path}/${name}` : `/${name}`,
            parentId,
            filesCount: 0,
            permissions: {
              read: ['all'],
              write: ['admin', 'editor'],
              delete: ['admin']
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'current-user'
          };
          
          set(state => ({
            folders: [...state.folders, newFolder],
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Ошибка создания папки', isLoading: false });
        }
      },

      deleteFolder: async (folderId) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            folders: state.folders.filter(folder => folder.id !== folderId),
            files: state.files.filter(file => file.folderId !== folderId),
            selectedFolder: state.selectedFolder === folderId ? null : state.selectedFolder,
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Ошибка удаления папки', isLoading: false });
        }
      },

      moveFolder: async (folderId, targetParentId) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            folders: state.folders.map(folder => 
              folder.id === folderId 
                ? { ...folder, parentId: targetParentId }
                : folder
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Ошибка перемещения папки', isLoading: false });
        }
      },

      updateFolder: async (folderId, updates) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            folders: state.folders.map(folder => 
              folder.id === folderId 
                ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
                : folder
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Ошибка обновления папки', isLoading: false });
        }
      },

      // Navigation and state
      selectFiles: (fileIds) => {
        set({ selectedFiles: fileIds });
      },

      selectFolder: (folderId) => {
        set({ selectedFolder: folderId });
        get().fetchFiles(folderId || undefined);
      },

      setCurrentPath: (path) => {
        set({ currentPath: path });
      },

      setFilter: (newFilter) => {
        set(state => ({ 
          filter: { ...state.filter, ...newFilter }
        }));
        get().fetchFiles(get().selectedFolder || undefined);
      },

      setSort: (sort) => {
        set({ sort });
        // Можно добавить сортировку на клиенте или отправить на сервер
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      clearSelection: () => {
        set({ selectedFiles: [], selectedFolder: null });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'files-store'
    }
  )
);

// Экспортируем утилитарные функции для использования в компонентах
export { formatFileSize, getFileTypeFromMime }; 
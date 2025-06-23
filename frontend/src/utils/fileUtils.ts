/**
 * Утилиты для работы с файлами
 */

/**
 * Проверяет доступность изображения по URL
 */
export const checkImageAvailability = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      resolve(true);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    // Добавляем параметр времени для обхода кэша
    img.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    
    // Таймаут 10 секунд
    setTimeout(() => {
      resolve(false);
    }, 10000);
  });
};

/**
 * Определяет тип файла по расширению
 */
export const getFileType = (fileName: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  if (documentExtensions.includes(extension)) return 'document';
  if (archiveExtensions.includes(extension)) return 'archive';
  
  return 'other';
};

/**
 * Форматирует размер файла в человекочитаемый вид
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Генерирует превью URL для изображения с параметрами размера
 */
export const generateThumbnailUrl = (originalUrl: string, width: number = 200, height: number = 200): string => {
  // Для Yandex Object Storage можно добавить параметры обработки изображений
  // Пока возвращаем оригинальный URL
  return originalUrl;
};

/**
 * Проверяет, является ли URL валидным
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Извлекает имя файла из URL
 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || 'unknown';
  } catch {
    return url.split('/').pop() || 'unknown';
  }
};

/**
 * Добавляет параметр времени к URL для обхода кэша
 */
export const addCacheBuster = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return url + separator + 't=' + Date.now();
};

/**
 * Проверяет CORS доступность файла
 */
export const checkCorsAvailability = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors'
    });
    return response.ok;
  } catch (error) {
    console.warn('CORS check failed:', error);
    return false;
  }
};

/**
 * Загружает файл с обработкой ошибок
 */
export const downloadFile = async (url: string, fileName?: string): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || getFileNameFromUrl(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback - открываем в новой вкладке
    window.open(url, '_blank');
  }
}; 
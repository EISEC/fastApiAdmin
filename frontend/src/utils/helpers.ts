/**
 * Функция для генерации slug из текста с поддержкой кириллицы
 */
export const generateSlugFromText = (text: string): string => {
  // Транслитерация кириллицы
  const cyrillic_to_latin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  
  let slug = text.toLowerCase();
  
  // Заменяем кириллицу на латиницу
  for (const [cyrillic, latin] of Object.entries(cyrillic_to_latin)) {
    slug = slug.replace(new RegExp(cyrillic, 'g'), latin);
  }
  
  // Заменяем все символы кроме букв, цифр на дефисы
  slug = slug.replace(/[^a-z0-9]/g, '-');
  
  // Убираем множественные дефисы
  slug = slug.replace(/-+/g, '-');
  
  // Убираем дефисы в начале и конце
  return slug.replace(/^-|-$/g, '');
};

/**
 * Форматирование даты в локальном формате
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
};

/**
 * Форматирование даты и времени в локальном формате
 */
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('ru-RU');
};

/**
 * Сокращение текста до указанной длины
 */
export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) {
    return text;
  }
  return text.substring(0, length).replace(/\s+\S*$/, '') + '...';
};

/**
 * Капитализация первой буквы строки
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Проверка валидности email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Проверка валидности URL
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
 * Форматирование размера файла в человеко-читаемый формат
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 
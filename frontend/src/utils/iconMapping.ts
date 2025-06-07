import { type AvailableIconName } from '../components/ui/Icon';

/**
 * Маппинг между эмодзи/текстовыми названиями и нашими иконками HugeIcons
 */
export const iconMapping: Record<string, AvailableIconName> = {
  // Эмодзи -> HugeIcons
  '⚙️': 'settings',
  '🏗️': 'edit',
  '🔥': 'fire',
  '📝': 'edit',
  '👤': 'user',
  '📧': 'mail',
  '✏️': 'edit',
  '📋': 'file',
  '🎯': 'fire',
  '🚀': 'fire',
  '🐛': 'bug',
  '⭐': 'star',
  '💡': 'fire',
  '🔧': 'settings',
  '📱': 'mobile',
  '🌐': 'globe',
  '👥': 'users',
  '📄': 'file',
  '📁': 'folder',
  '🔐': 'lock',
  '🎨': 'palette',
  '📊': 'dashboard',
  '💰': 'money',
  '🔍': 'search',
  '⚡': 'fire',
  '🎉': 'star',
  '📌': 'fire',
  '🌟': 'star',
  '⬆️': 'arrowUp',
  '⬇️': 'arrowDown',
  '◀️': 'arrowLeft',
  '▶️': 'arrowRight',
  '❌': 'close',
  '✅': 'check',
  '❓': 'question',
  '❗': 'alert',
  '🗑️': 'delete',
  '🔄': 'refresh',
  
  // Текстовые названия -> HugeIcons
  'general': 'settings',
  'appearance': 'palette',
  'seo': 'search',
  'notifications': 'fire',
  'security': 'shield',
  'integrations': 'link',
  'performance': 'fire',
  'developer': 'code',
  'database': 'database',
  'system': 'settings',
  'admin': 'user',
  'content': 'file',
  'media': 'image',
  'users': 'users',
  'posts': 'edit',
  'pages': 'file',
  'analytics': 'dashboard',
  'backups': 'database',
  'logs': 'file',
  'api': 'code',
  'cache': 'fire',
  'email': 'mail',
  'social': 'share',
  'payments': 'creditCard',
  'shipping': 'folder',
  'taxes': 'money',
  'reports': 'dashboard',
  'tools': 'settings',
  'help': 'question',
  'about': 'info',
  
  // Альтернативные названия
  'setting': 'settings',
  'config': 'settings',
  'configuration': 'settings',
  'preferences': 'settings',
  'options': 'settings',
  'profile': 'user',
  'account': 'user',
  'dashboard': 'dashboard',
  'home': 'home',
  'overview': 'dashboard',
  'stats': 'dashboard',
  'statistics': 'dashboard',
  'metrics': 'dashboard',
  'inbox': 'mail',
  'messages': 'message',
  'contacts': 'users',
  'calendar': 'calendar',
  'schedule': 'calendar',
  'tasks': 'check',
  'todo': 'check',
  'projects': 'folder',
  'files': 'folder',
  'documents': 'file',
  'images': 'image',
  'photos': 'image',
  'videos': 'video',
  'audio': 'fire',
  'downloads': 'download',
  'uploads': 'upload',
  'trash': 'delete',
  'archive': 'folder',
  'favorites': 'star',
  'bookmarks': 'star',
  'tags': 'tag',
  'categories': 'folder',
  'filters': 'filter',
  'sort': 'fire',
  'search': 'search',
  'find': 'search',
  'edit': 'edit',
  'create': 'add',
  'new': 'add',
  'delete': 'delete',
  'remove': 'delete',
  'save': 'check',
  'export': 'download',
  'import': 'upload',
  'backup': 'database',
  'restore': 'refresh',
  'sync': 'refresh',
  'update': 'refresh',
  'reload': 'refresh',
  'refresh': 'refresh',
  'reset': 'refresh',
  'clear': 'close',
  'close': 'close',
  'cancel': 'close',
  'ok': 'check',
  'yes': 'check',
  'no': 'close',
  'info': 'info',
  'warning': 'warning',
  'error': 'alert',
  'success': 'check',
  'loading': 'loading',
  'spinner': 'loading',
};

/**
 * Получает название иконки HugeIcons по эмодзи или текстовому названию
 * @param iconName - эмодзи, текстовое название или уже корректное название иконки
 * @param fallback - иконка по умолчанию если маппинг не найден
 * @returns название иконки HugeIcons
 */
export function getIconName(iconName: string | undefined, fallback: AvailableIconName = 'settings'): AvailableIconName {
  if (!iconName || typeof iconName !== 'string') {
    return fallback;
  }
  
  // Удаляем лишние пробелы и приводим к нижнему регистру
  const cleanName = iconName.trim().toLowerCase();
  
  // Если это уже корректное название иконки, возвращаем его
  if (isValidIconName(cleanName as AvailableIconName)) {
    return cleanName as AvailableIconName;
  }
  
  // Ищем в маппинге
  const mappedIcon = iconMapping[iconName] || iconMapping[cleanName];
  if (mappedIcon) {
    return mappedIcon;
  }
  
  // Пытаемся найти частичное совпадение
  for (const [key, value] of Object.entries(iconMapping)) {
    if (cleanName.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanName)) {
      return value;
    }
  }
  
  return fallback;
}

/**
 * Проверяет, является ли название корректным именем иконки
 */
function isValidIconName(name: string): name is AvailableIconName {
  // Здесь можно добавить проверку, но пока просто возвращаем true для любой строки
  // В реальности можно импортировать список всех доступных иконок
  return typeof name === 'string' && name.length > 0;
}

/**
 * Компонент для безопасного отображения иконки
 */
export function renderSafeIcon(iconName: string | undefined, fallback: AvailableIconName = 'settings'): AvailableIconName {
  return getIconName(iconName, fallback);
} 
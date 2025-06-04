from django.core.management.base import BaseCommand
from django.urls import get_resolver


class Command(BaseCommand):
    help = 'Проверка доступных API URL patterns'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Проверка API URL patterns...\n')
        
        resolver = get_resolver()
        
        # Ищем все URL patterns, которые содержат 'api/v1'
        def extract_patterns(urlpatterns, prefix=''):
            patterns = []
            for pattern in urlpatterns:
                if hasattr(pattern, 'url_patterns'):
                    # Это include() - рекурсивно обходим
                    new_prefix = prefix + str(pattern.pattern)
                    patterns.extend(extract_patterns(pattern.url_patterns, new_prefix))
                else:
                    # Это обычный URL pattern
                    full_pattern = prefix + str(pattern.pattern)
                    if hasattr(pattern, 'callback') and pattern.callback:
                        view_name = pattern.callback.__name__ if hasattr(pattern.callback, '__name__') else str(pattern.callback)
                        patterns.append((full_pattern, view_name))
            return patterns
        
        all_patterns = extract_patterns(resolver.url_patterns)
        
        # Фильтруем API patterns
        api_patterns = [p for p in all_patterns if 'api/v1' in p[0]]
        
        self.stdout.write('📋 Найденные API endpoints:\n')
        
        categories = {
            'auth': [],
            'sites': [],
            'posts': [],
            'pages': [],
            'settings': [],
            'other': []
        }
        
        for pattern, view_name in api_patterns:
            clean_pattern = pattern.replace('^', '').replace('$', '').replace('\\', '')
            
            if '/auth/' in clean_pattern:
                categories['auth'].append((clean_pattern, view_name))
            elif '/sites/' in clean_pattern:
                categories['sites'].append((clean_pattern, view_name))
            elif '/posts/' in clean_pattern:
                categories['posts'].append((clean_pattern, view_name))
            elif '/pages/' in clean_pattern:
                categories['pages'].append((clean_pattern, view_name))
            elif '/settings/' in clean_pattern:
                categories['settings'].append((clean_pattern, view_name))
            else:
                categories['other'].append((clean_pattern, view_name))
        
        for category, patterns in categories.items():
            if patterns:
                self.stdout.write(f'\n🔹 {category.upper()}:')
                for pattern, view_name in sorted(patterns):
                    self.stdout.write(f'   • /{pattern}')
        
        # Проверяем специфичные endpoints для frontend
        frontend_endpoints = [
            'api/v1/auth/users/',
            'api/v1/auth/roles/',
            'api/v1/sites/',
            'api/v1/posts/',
            'api/v1/posts/categories/',
            'api/v1/posts/tags/',
            'api/v1/pages/',
            'api/v1/settings/',
            'api/v1/settings/categories/',
            'api/v1/settings/groups/',
            'api/v1/settings/bulk/',
            'api/v1/settings/import/',
        ]
        
        self.stdout.write('\n🎯 Проверка ключевых endpoints для frontend:')
        
        found_patterns = [p[0].replace('^', '').replace('$', '').replace('\\', '') for p in api_patterns]
        
        for endpoint in frontend_endpoints:
            # Проверяем точное совпадение или с regex паттернами
            found = False
            for pattern in found_patterns:
                if endpoint in pattern or pattern in endpoint:
                    found = True
                    break
            
            if found:
                self.stdout.write(f'   ✅ {endpoint}')
            else:
                self.stdout.write(f'   ❌ {endpoint} - НЕ НАЙДЕН')
        
        self.stdout.write(f'\n📊 Всего API endpoints: {len(api_patterns)}')
        self.stdout.write(
            self.style.SUCCESS('✅ Проверка URL patterns завершена!')
        ) 
from django.core.management.base import BaseCommand
from django.core.cache import cache
import json

class Command(BaseCommand):
    help = 'Debug cache status and keys'

    def handle(self, *args, **options):
        self.stdout.write("🔍 Debugging Cache Status")
        self.stdout.write("=" * 50)
        
        # Проверяем все ключи кэша
        try:
            keys = cache.keys('*')
            self.stdout.write(f"Total cache keys: {len(keys)}")
            
            # Показываем api_cache ключи
            api_keys = [k for k in keys if k.startswith('api_cache:')]
            self.stdout.write(f"API cache keys: {len(api_keys)}")
            
            for key in api_keys[:10]:
                self.stdout.write(f"  - {key}")
                
            # Показываем cache_stats
            stats = cache.get('cache_stats', {})
            self.stdout.write(f"Cache stats: {stats}")
            
            # Тестируем простое кэширование
            self.stdout.write("\n🧪 Testing simple cache...")
            cache.set('test_key', {'test': 'data'}, 60)
            result = cache.get('test_key')
            self.stdout.write(f"Test result: {result}")
            
            # Очищаем тестовый ключ
            cache.delete('test_key')
            
        except Exception as e:
            self.stdout.write(f"❌ Error: {e}")
            
        self.stdout.write("✅ Cache debug completed!") 
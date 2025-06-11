#!/usr/bin/env python3
"""
Диагностика проблемы с пользователем pipka@eisec.ru
"""

import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from apps.accounts.models import CustomUser, Role
from apps.sites.models import Site, SiteRequest


def debug_user():
    """Полная диагностика пользователя"""
    print('🔍 ПОЛНАЯ ДИАГНОСТИКА ПОЛЬЗОВАТЕЛЯ')
    print('═══════════════════════════════════')
    
    try:
        # 1. Проверяем пользователя
        user = CustomUser.objects.get(email='pipka@eisec.ru')
        print('\n1. 👤 ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:')
        print(f'   📧 Email: {user.email}')
        print(f'   🆔 ID: {user.id}')
        print(f'   👤 Username: {user.username}')
        print(f'   ✅ Is active: {user.is_active}')
        print(f'   🔒 Role: {user.role.name if user.role else "NO ROLE"}')
        print(f'   🔒 Role ID: {user.role.id if user.role else "NO ROLE"}')
        
        # 2. Проверяем роли
        print('\n2. 🏷️ РОЛИ В СИСТЕМЕ:')
        roles = Role.objects.all()
        for role in roles:
            is_current = user.role and user.role.id == role.id
            marker = '✅' if is_current else '  '
            print(f'   {marker} {role.name} (ID: {role.id}) - {role.get_name_display()}')
        
        print(f'\n   🔍 Константа Role.USER: "{Role.USER}"')
        print(f'   🔍 Роль пользователя: "{user.role.name}"')
        print(f'   🔍 Сравнение: {user.role.name == Role.USER}')
        
        # 3. Проверяем доступные сайты
        print('\n3. 🌐 АНАЛИЗ ДОСТУПНЫХ САЙТОВ:')
        sites = Site.objects.filter(is_active=True)
        print(f'   📊 Всего активных сайтов: {sites.count()}')
        
        available_count = 0
        for site in sites:
            print(f'\n   🏠 Сайт: {site.name} (ID: {site.id})')
            print(f'      🔗 Домен: {site.domain}')
            print(f'      👤 Владелец: {site.owner.email}')
            
            # Проверки доступности
            user_assigned = user in site.assigned_users.all()
            has_pending = SiteRequest.objects.filter(user=user, site=site, status='pending').exists()
            is_owner = site.owner == user
            
            print(f'      ✅ Активен: {site.is_active}')
            print(f'      🔒 Пользователь назначен: {user_assigned}')
            print(f'      ⏳ Есть pending запрос: {has_pending}')
            print(f'      👑 Пользователь владелец: {is_owner}')
            
            # Итоговая проверка доступности
            can_request = (
                site.is_active and 
                not user_assigned and 
                not has_pending and
                not is_owner
            )
            
            print(f'      🎯 МОЖНО ЗАПРОСИТЬ ДОСТУП: {can_request}')
            
            if can_request:
                available_count += 1
        
        print(f'\n   📊 Итого доступных для запроса сайтов: {available_count}')
        
        # 4. Проверяем существующие запросы пользователя
        print('\n4. 📝 СУЩЕСТВУЮЩИЕ ЗАПРОСЫ:')
        existing_requests = SiteRequest.objects.filter(user=user)
        print(f'   📊 Всего запросов: {existing_requests.count()}')
        
        for req in existing_requests:
            print(f'   🏠 {req.site.name} - {req.status} (создан: {req.created_at})')
        
        # 5. Тестируем создание запроса программно
        print('\n5. 🧪 ТЕСТ СОЗДАНИЯ ЗАПРОСА ПРОГРАММНО:')
        
        if available_count > 0:
            test_site = Site.objects.filter(is_active=True).exclude(
                assigned_users=user
            ).exclude(
                owner=user
            ).first()
            
            if test_site:
                print(f'   🎯 Тестовый сайт: {test_site.name}')
                
                # Проверяем все условия еще раз
                print(f'   ✅ hasattr(user, \"role\"): {hasattr(user, "role")}')
                print(f'   ✅ user.role: {user.role}')
                print(f'   ✅ user.role.name: {user.role.name}')
                print(f'   ✅ Role.USER: {Role.USER}')
                print(f'   ✅ user.role.name == Role.USER: {user.role.name == Role.USER}')
                
                # Попытка создания
                try:
                    request_obj = SiteRequest.objects.create(
                        user=user,
                        site=test_site,
                        requested_role='author',
                        message='Программный тест создания запроса'
                    )
                    print(f'   ✅ УСПЕХ! Запрос создан с ID: {request_obj.id}')
                    
                    # Удаляем тестовый запрос
                    request_obj.delete()
                    print(f'   🗑️ Тестовый запрос удален')
                    
                except Exception as e:
                    print(f'   ❌ ОШИБКА при программном создании: {e}')
            else:
                print('   ⚠️ Нет подходящих сайтов для теста')
        else:
            print('   ⚠️ Нет доступных сайтов для тестирования')
        
        print('\n═══════════════════════════════════')
        print('🎯 ДИАГНОСТИКА ЗАВЕРШЕНА')
        
    except CustomUser.DoesNotExist:
        print('❌ Пользователь pipka@eisec.ru не найден!')
    except Exception as e:
        print(f'❌ Критическая ошибка: {e}')
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    debug_user() 
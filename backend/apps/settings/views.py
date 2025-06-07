from django.shortcuts import render
import json
from django.utils import timezone
from django.db import models
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.db import transaction

from .models import SettingCategory, SettingGroup, Setting, SettingTemplate, SocialNetworkSetting
from .permissions import SettingsPermission, SuperAdminOnlyPermission
from .serializers import (
    SettingCategorySerializer,
    SettingGroupSerializer,
    SettingSerializer,
    SettingValueUpdateSerializer,
    BulkSettingsUpdateSerializer,
    SettingTemplateSerializer,
    SettingsExportSerializer,
    SettingsImportSerializer,
    SocialNetworkSettingSerializer
)
from .utils import invalidate_settings_cache


class SettingCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для категорий настроек (только чтение, только для суперадминистраторов)"""
    queryset = SettingCategory.objects.filter(is_active=True)
    serializer_class = SettingCategorySerializer
    permission_classes = [SuperAdminOnlyPermission]
    ordering = ['order', 'name']

    @action(detail=False, methods=['get'])
    def list_all(self, request):
        """Простой endpoint для получения всех категорий без пагинации"""
        categories = self.get_queryset()
        
        # Преобразуем в простой формат для frontend
        categories_data = []
        for category in categories:
            # Получаем группы для категории
            groups = SettingGroup.objects.filter(category=category, is_active=True).order_by('order', 'name')
            groups_data = []
            
            for group in groups:
                # Получаем настройки для группы
                settings = Setting.objects.filter(group=group).order_by('order', 'label')
                settings_data = []
                
                for setting in settings:
                    settings_data.append({
                        'id': str(setting.id) if setting.id else setting.key,
                        'key': setting.key,
                        'value': setting.get_value(),
                        'type': setting.type,
                        'category': category.id,
                        'label': setting.label,
                        'description': setting.description,
                        'placeholder': setting.placeholder,
                        'required': setting.is_required,
                        'readonly': setting.is_readonly,
                        'group': group.name,
                        'order': setting.order,
                        'options': setting.options,
                        'validation': setting.validation_rules,
                        'help_text': setting.help_text,
                        'help_url': setting.help_url,
                        'createdAt': setting.created_at.isoformat() if setting.created_at else None,
                        'updatedAt': setting.updated_at.isoformat() if setting.updated_at else None,
                    })
                
                groups_data.append({
                    'id': group.id,
                    'name': group.name,
                    'description': group.description,
                    'icon': group.icon,
                    'order': group.order,
                    'settings': settings_data
                })
            
            categories_data.append({
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'icon': category.icon,
                'order': category.order,
                'groups': groups_data
            })
        
        return Response(categories_data)


class SettingGroupViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для групп настроек (только чтение, только для суперадминистраторов)"""
    queryset = SettingGroup.objects.filter(is_active=True)
    serializer_class = SettingGroupSerializer
    permission_classes = [SuperAdminOnlyPermission]
    ordering = ['order', 'name']


class SettingViewSet(viewsets.ModelViewSet):
    """ViewSet для настроек (только для суперадминистраторов)"""
    queryset = Setting.objects.all()
    serializer_class = SettingSerializer
    permission_classes = [SettingsPermission]
    lookup_field = 'key'
    ordering = ['group__order', 'order', 'label']

    def get_queryset(self):
        """Фильтруем настройки"""
        queryset = Setting.objects.select_related('group', 'group__category')
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def list_all(self, request):
        """Простой endpoint для получения всех настроек (для всех авторизованных пользователей)"""
        queryset = self.get_queryset()
        
        # Преобразуем в формат ожидаемый frontend
        settings_data = []
        for setting in queryset:
            settings_data.append({
                'id': str(setting.id) if setting.id else setting.key,
                'key': setting.key,
                'value': setting.get_value(),
                'type': setting.type,
                'category': setting.group.category.id,
                'label': setting.label,
                'description': setting.description,
                'placeholder': setting.placeholder,
                'required': setting.is_required,
                'readonly': setting.is_readonly,
                'group': setting.group.name,
                'order': setting.order,
                'options': setting.options,
                'validation': setting.validation_rules,
                'help_text': setting.help_text,
                'help_url': setting.help_url,
                'createdAt': setting.created_at.isoformat() if setting.created_at else None,
                'updatedAt': setting.updated_at.isoformat() if setting.updated_at else None,
            })
        
        return Response(settings_data)

    @action(detail=False, methods=['put'])
    def bulk_update(self, request):
        """Массовое обновление настроек (только для суперадминистраторов)"""
        updates = request.data.get('updates', [])
        
        if not updates:
            return Response(
                {'error': 'Не указаны обновления'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                updated_settings = []
                errors = []

                for update in updates:
                    key = update.get('key')
                    value = update.get('value')
                    
                    if not key:
                        errors.append('Не указан ключ настройки')
                        continue
                    
                    try:
                        setting = Setting.objects.get(key=key)
                        setting.set_value(value, request.user)
                        updated_settings.append({
                            'key': setting.key,
                            'value': setting.value,
                            'updated_at': setting.updated_at.isoformat()
                        })
                    except Setting.DoesNotExist:
                        errors.append(f"Настройка '{key}' не найдена")
                    except Exception as e:
                        errors.append(f"Ошибка обновления '{key}': {str(e)}")

                if errors:
                    return Response({
                        'errors': errors,
                        'updated': updated_settings
                    }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'error': f"Ошибка транзакции: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Очищаем кэш после успешного обновления
        invalidate_settings_cache()

        return Response({
            'success': True,
            'updated': updated_settings,
            'count': len(updated_settings)
        })

    @action(detail=False, methods=['post'])
    def export(self, request):
        """Экспорт настроек"""
        serializer = SettingsExportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        categories = serializer.validated_data.get('categories', [])
        include_defaults = serializer.validated_data.get('include_defaults', False)
        export_format = serializer.validated_data.get('format', 'json')

        # Получаем настройки
        queryset = self.get_queryset()
        if categories:
            queryset = queryset.filter(group__category__id__in=categories)

        # Формируем данные для экспорта
        export_data = {
            'version': '1.0',
            'exported_at': timezone.now().isoformat(),
            'categories': [],
            'settings': {}
        }

        # Группируем по категориям
        settings_by_category = {}
        for setting in queryset:
            category_id = setting.group.category.id
            if category_id not in settings_by_category:
                settings_by_category[category_id] = {
                    'id': category_id,
                    'name': setting.group.category.name,
                    'settings': []
                }
            
            value = setting.value if not include_defaults else setting.get_value()
            settings_by_category[category_id]['settings'].append({
                'key': setting.key,
                'value': value,
                'type': setting.type,
                'label': setting.label
            })
            export_data['settings'][setting.key] = value

        export_data['categories'] = list(settings_by_category.values())

        if export_format == 'json':
            return JsonResponse(export_data, json_dumps_params={'indent': 2, 'ensure_ascii': False})
        else:
            # TODO: Добавить поддержку YAML если нужно
            return Response({'error': 'Формат YAML пока не поддерживается'}, 
                          status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['put'])
    def import_data(self, request):
        """Импорт настроек"""
        updates = request.data.get('updates', [])
        
        if not updates:
            return Response(
                {'error': 'Не указаны данные для импорта'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                imported_count = 0
                errors = []

                for update in updates:
                    key = update.get('key')
                    value = update.get('value')
                    
                    if not key:
                        continue
                    
                    try:
                        setting = Setting.objects.get(key=key)
                        setting.set_value(value, request.user)
                        imported_count += 1
                    except Setting.DoesNotExist:
                        errors.append(f"Настройка '{key}' не найдена")
                    except Exception as e:
                        errors.append(f"Ошибка импорта '{key}': {str(e)}")

        except Exception as e:
            return Response({
                'error': f"Ошибка импорта: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Очищаем кэш после успешного импорта
        invalidate_settings_cache()

        return Response({
            'success': True,
            'imported': imported_count,
            'errors': errors
        })


class SettingTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet для шаблонов настроек (только для суперадминистраторов)"""
    serializer_class = SettingTemplateSerializer
    permission_classes = [SuperAdminOnlyPermission]

    def get_queryset(self):
        """Показываем публичные шаблоны и шаблоны пользователя"""
        user = self.request.user
        return SettingTemplate.objects.filter(
            models.Q(is_public=True) | models.Q(created_by=user)
        ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Применение шаблона настроек (только для суперадминистраторов)"""
        template = self.get_object()
        
        try:
            with transaction.atomic():
                applied_count = 0
                errors = []
                
                for key, value in template.settings_data.items():
                    try:
                        setting = Setting.objects.get(key=key)
                        setting.set_value(value, request.user)
                        applied_count += 1
                    except Setting.DoesNotExist:
                        errors.append(f"Настройка не найдена: {key}")
                    except Exception as e:
                        errors.append(f"Ошибка применения {key}: {str(e)}")

                return Response({
                    'success': True,
                    'applied': applied_count,
                    'errors': errors
                })

        except Exception as e:
            return Response({
                'error': f"Ошибка применения шаблона: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SocialNetworkSettingViewSet(viewsets.ModelViewSet):
    """ViewSet для настроек социальных сетей (только для суперадминистраторов)"""
    serializer_class = SocialNetworkSettingSerializer
    permission_classes = [SuperAdminOnlyPermission]
    ordering = ['order', 'name']

    def get_queryset(self):
        """Получаем все социальные сети упорядоченно"""
        return SocialNetworkSetting.objects.all().order_by('order', 'name')

    def perform_create(self, serializer):
        """Сохраняем информацию о создателе и очищаем кэш"""
        serializer.save(created_by=self.request.user)
        invalidate_settings_cache()

    def perform_update(self, serializer):
        """Очищаем кэш после обновления"""
        serializer.save()
        invalidate_settings_cache()

    def perform_destroy(self, instance):
        """Очищаем кэш после удаления"""
        instance.delete()
        invalidate_settings_cache()

    @action(detail=False, methods=['put'])
    def reorder(self, request):
        """Изменение порядка социальных сетей"""
        items = request.data.get('items', [])
        
        if not items:
            return Response(
                {'error': 'Не указаны элементы для перестановки'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                for i, item_data in enumerate(items):
                    item_id = item_data.get('id')
                    if item_id:
                        SocialNetworkSetting.objects.filter(id=item_id).update(order=i)

                # Очищаем кэш после изменения порядка
                invalidate_settings_cache()

                return Response({'success': True, 'message': 'Порядок обновлен'})

        except Exception as e:
            return Response({
                'error': f"Ошибка обновления порядка: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def public_list(self, request):
        """Публичный список социальных сетей для всех авторизованных пользователей"""
        networks = SocialNetworkSetting.objects.filter(is_enabled=True).order_by('order', 'name')
        serializer = self.get_serializer(networks, many=True)
        return Response(serializer.data)

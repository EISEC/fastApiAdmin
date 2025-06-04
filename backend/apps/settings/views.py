from django.shortcuts import render
import json
from django.utils import timezone
from django.db import models
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.db import transaction

from .models import SettingCategory, SettingGroup, Setting, SettingTemplate
from .serializers import (
    SettingCategorySerializer,
    SettingGroupSerializer,
    SettingSerializer,
    SettingValueUpdateSerializer,
    BulkSettingsUpdateSerializer,
    SettingTemplateSerializer,
    SettingsExportSerializer,
    SettingsImportSerializer
)


class SettingCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для категорий настроек (только чтение)"""
    queryset = SettingCategory.objects.filter(is_active=True)
    serializer_class = SettingCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['order', 'name']


class SettingGroupViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для групп настроек (только чтение)"""
    queryset = SettingGroup.objects.filter(is_active=True)
    serializer_class = SettingGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['order', 'name']


class SettingViewSet(viewsets.ModelViewSet):
    """ViewSet для настроек"""
    queryset = Setting.objects.all()
    serializer_class = SettingSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'key'
    ordering = ['group__order', 'order', 'label']

    def get_queryset(self):
        """Фильтруем настройки по сайту если указан"""
        queryset = Setting.objects.select_related('group', 'group__category')
        
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        else:
            # Глобальные настройки (без привязки к сайту)
            queryset = queryset.filter(site__isnull=True)
            
        return queryset

    @action(detail=False, methods=['get'])
    def list_all(self, request):
        """Простой endpoint для получения всех настроек"""
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
        """Массовое обновление настроек"""
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

        return Response({
            'success': True,
            'imported': imported_count,
            'errors': errors
        })


class SettingTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet для шаблонов настроек"""
    serializer_class = SettingTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Показываем публичные шаблоны и шаблоны пользователя"""
        user = self.request.user
        return SettingTemplate.objects.filter(
            models.Q(is_public=True) | models.Q(created_by=user)
        ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Применение шаблона настроек"""
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

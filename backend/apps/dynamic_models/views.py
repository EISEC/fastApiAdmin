from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import (
    DynamicModel,
    DynamicModelData, 
    DynamicModelVersion,
    DynamicFieldType,
    DynamicModelExtension,
    DynamicModelPermission
)
from .serializers import (
    DynamicModelSerializer,
    DynamicModelDataSerializer,
    DynamicModelVersionSerializer,
    DynamicFieldTypeSerializer,
    DynamicModelExtensionSerializer,
    DynamicModelPermissionSerializer,
    DynamicModelConfigExportSerializer,
    DynamicModelConfigImportSerializer
)
from .permissions import (
    DynamicModelPermission as DynamicModelPerm,
    DynamicModelDataPermission,
    DynamicModelManagementPermission,
    DynamicFieldTypePermission
)


class DynamicFieldTypeViewSet(viewsets.ModelViewSet):
    """ViewSet для управления типами полей"""
    
    queryset = DynamicFieldType.objects.filter(is_active=True)
    serializer_class = DynamicFieldTypeSerializer
    permission_classes = [IsAuthenticated, DynamicFieldTypePermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'label', 'description']
    ordering_fields = ['name', 'label', 'category', 'created_at']
    ordering = ['category', 'label']
    
    def get_queryset(self):
        """Кастомная фильтрация вместо DjangoFilterBackend"""
        queryset = super().get_queryset()
        
        # Фильтр по категории
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Фильтр по активности
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Возвращает список категорий типов полей"""
        categories = DynamicFieldType.FIELD_CATEGORIES
        return Response([{'value': cat[0], 'label': cat[1]} for cat in categories])


class DynamicModelVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для просмотра версий моделей (только чтение)"""
    
    queryset = DynamicModelVersion.objects.all()
    serializer_class = DynamicModelVersionSerializer
    permission_classes = [IsAuthenticated, DynamicModelManagementPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['dynamic_model__name', 'changes_description']
    ordering_fields = ['created_at', 'dynamic_model__version']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Фильтруем версии по доступным пользователю сайтам"""
        user = self.request.user
        user_role = user.role.name if hasattr(user, 'role') and user.role else None
        
        queryset = self.queryset
        
        # Кастомная фильтрация
        dynamic_model = self.request.query_params.get('dynamic_model')
        if dynamic_model:
            queryset = queryset.filter(dynamic_model_id=dynamic_model)
        
        created_by = self.request.query_params.get('created_by')
        if created_by:
            queryset = queryset.filter(created_by_id=created_by)
        
        is_rollback = self.request.query_params.get('is_rollback')
        if is_rollback is not None:
            queryset = queryset.filter(is_rollback=is_rollback.lower() == 'true')
        
        # Фильтрация по правам доступа
        if user_role == 'superuser':
            return queryset
        elif user_role == 'admin':
            return queryset.filter(dynamic_model__site__owner=user)
        
        return queryset.none()


class DynamicModelExtensionViewSet(viewsets.ModelViewSet):
    """ViewSet для управления расширениями моделей"""
    
    queryset = DynamicModelExtension.objects.filter(is_active=True)
    serializer_class = DynamicModelExtensionSerializer
    permission_classes = [IsAuthenticated, DynamicModelManagementPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['dynamic_model__name', 'target_model']
    ordering_fields = ['created_at', 'dynamic_model__name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Фильтруем расширения по доступным пользователю сайтам"""
        user = self.request.user
        user_role = user.role.name if hasattr(user, 'role') and user.role else None
        
        queryset = self.queryset
        
        # Кастомная фильтрация
        dynamic_model = self.request.query_params.get('dynamic_model')
        if dynamic_model:
            queryset = queryset.filter(dynamic_model_id=dynamic_model)
        
        extension_type = self.request.query_params.get('extension_type')
        if extension_type:
            queryset = queryset.filter(extension_type=extension_type)
        
        migration_applied = self.request.query_params.get('migration_applied')
        if migration_applied is not None:
            queryset = queryset.filter(migration_applied=migration_applied.lower() == 'true')
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Фильтрация по правам доступа
        if user_role == 'superuser':
            return queryset
        elif user_role == 'admin':
            return queryset.filter(dynamic_model__site__owner=user)
        
        return queryset.none()
    
    @action(detail=True, methods=['post'])
    def apply_extension(self, request, pk=None):
        """Применяет расширение к целевой модели"""
        extension = self.get_object()
        
        try:
            result = extension.apply_extension()
            if result:
                return Response({
                    'status': 'success',
                    'message': 'Расширение успешно применено'
                })
            else:
                return Response({
                    'status': 'error',
                    'message': 'Не удалось применить расширение'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class DynamicModelPermissionViewSet(viewsets.ModelViewSet):
    """ViewSet для управления разрешениями моделей"""
    
    queryset = DynamicModelPermission.objects.filter(is_active=True)
    serializer_class = DynamicModelPermissionSerializer
    permission_classes = [IsAuthenticated, DynamicModelManagementPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['dynamic_model__name', 'user__email', 'role__name']
    ordering_fields = ['created_at', 'permission_type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Фильтруем разрешения по доступным пользователю сайтам"""
        user = self.request.user
        user_role = user.role.name if hasattr(user, 'role') and user.role else None
        
        queryset = self.queryset
        
        # Кастомная фильтрация
        dynamic_model = self.request.query_params.get('dynamic_model')
        if dynamic_model:
            queryset = queryset.filter(dynamic_model_id=dynamic_model)
        
        permission_type = self.request.query_params.get('permission_type')
        if permission_type:
            queryset = queryset.filter(permission_type=permission_type)
        
        filter_user = self.request.query_params.get('user')
        if filter_user:
            queryset = queryset.filter(user_id=filter_user)
        
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role_id=role)
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Фильтрация по правам доступа
        if user_role == 'superuser':
            return queryset
        elif user_role == 'admin':
            return queryset.filter(dynamic_model__site__owner=user)
        
        return queryset.none()


class DynamicModelViewSet(viewsets.ModelViewSet):
    """ViewSet для управления динамическими моделями"""
    
    queryset = DynamicModel.objects.filter(is_active=True)
    serializer_class = DynamicModelSerializer
    permission_classes = [IsAuthenticated, DynamicModelPerm]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'table_name']
    ordering_fields = ['name', 'created_at', 'updated_at', 'version']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Фильтруем модели по доступным пользователю сайтам"""
        user = self.request.user
        user_role = user.role.name if hasattr(user, 'role') and user.role else None
        
        queryset = self.queryset
        
        # Кастомная фильтрация
        site = self.request.query_params.get('site')
        if site:
            queryset = queryset.filter(site_id=site)
        
        model_type = self.request.query_params.get('model_type')
        if model_type:
            queryset = queryset.filter(model_type=model_type)
        
        # Фильтрация по правам доступа
        if user_role == 'superuser':
            return queryset
        elif user_role == 'admin':
            return queryset.filter(site__owner=user)
        elif user_role == 'author':
            return queryset.filter(site__assigned_users=user)
        
        return queryset.none()
    
    def perform_create(self, serializer):
        """При создании устанавливаем владельца"""
        # Для админов автоматически устанавливаем сайт из их сайтов
        user_role = self.request.user.role.name if hasattr(self.request.user, 'role') and self.request.user.role else None
        
        if user_role == 'admin' and not serializer.validated_data.get('site'):
            # Можно добавить логику автоматического выбора сайта
            pass
        
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        """Создает новую версию модели"""
        dynamic_model = self.get_object()
        
        try:
            with transaction.atomic():
                new_version = dynamic_model.create_new_version(user=request.user)
                serializer = self.get_serializer(new_version)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Предварительный просмотр модели"""
        dynamic_model = self.get_object()
        
        # Генерируем превью на основе конфигурации полей
        preview_data = {
            'model_info': {
                'name': dynamic_model.name,
                'type': dynamic_model.model_type,
                'description': dynamic_model.description,
                'table_name': dynamic_model.table_name
            },
            'fields': dynamic_model.fields_config.get('fields', []),
            'form_preview': self._generate_form_preview(dynamic_model),
            'table_preview': self._generate_table_preview(dynamic_model)
        }
        
        return Response(preview_data)
    
    def _generate_form_preview(self, dynamic_model):
        """Генерирует превью формы"""
        fields = dynamic_model.fields_config.get('fields', [])
        form_fields = []
        
        for field in fields:
            form_field = {
                'name': field['name'],
                'label': field['label'],
                'type': field['type'],
                'required': field.get('required', False),
                'placeholder': field.get('placeholder', ''),
                'help_text': field.get('help_text', ''),
                'options': field.get('options', []) if field['type'] in ['select', 'multiselect', 'radio', 'checkbox'] else None
            }
            form_fields.append(form_field)
        
        return form_fields
    
    def _generate_table_preview(self, dynamic_model):
        """Генерирует превью таблицы"""
        display_fields = dynamic_model.get_display_fields()
        
        columns = []
        for field in display_fields:
            column = {
                'key': field['name'],
                'title': field['label'],
                'type': field['type'],
                'sortable': field.get('sortable', True),
                'searchable': field.get('searchable', True)
            }
            columns.append(column)
        
        return {
            'columns': columns,
            'sample_data': self._generate_sample_data(display_fields)
        }
    
    def _generate_sample_data(self, fields):
        """Генерирует примеры данных"""
        sample_data = []
        
        for i in range(3):
            row = {}
            for field in fields:
                field_type = field['type']
                field_name = field['name']
                
                # Генерируем примеры данных в зависимости от типа поля
                if field_type == 'text':
                    row[field_name] = f"Пример текста {i+1}"
                elif field_type == 'number':
                    row[field_name] = (i+1) * 10
                elif field_type == 'email':
                    row[field_name] = f"user{i+1}@example.com"
                elif field_type == 'date':
                    row[field_name] = f"2024-01-{i+1:02d}"
                elif field_type == 'boolean':
                    row[field_name] = i % 2 == 0
                else:
                    row[field_name] = f"Значение {i+1}"
            
            sample_data.append(row)
        
        return sample_data
    
    @action(detail=True, methods=['get'])
    def export_config(self, request, pk=None):
        """Экспорт конфигурации модели"""
        dynamic_model = self.get_object()
        serializer = DynamicModelConfigExportSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        export_data = dynamic_model.export_config()
        
        # Дополнительные данные при необходимости
        if serializer.validated_data.get('include_data'):
            export_data['data_entries'] = list(
                dynamic_model.data_entries.filter(is_published=True)
                .values('data', 'created_at')
            )
        
        if serializer.validated_data.get('include_permissions'):
            export_data['permissions'] = list(
                dynamic_model.custom_permissions.filter(is_active=True)
                .values('permission_type', 'field_restrictions', 'conditions')
            )
        
        return Response(export_data)
    
    @action(detail=False, methods=['post'])
    def import_config(self, request):
        """Импорт конфигурации модели"""
        serializer = DynamicModelConfigImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        config_data = serializer.validated_data['config_data']
        override_existing = serializer.validated_data.get('override_existing', False)
        
        # Определяем сайт для импорта
        user = request.user
        user_role = user.role.name if hasattr(user, 'role') and user.role else None
        
        if user_role == 'admin':
            # Для админа импортируем в его основной сайт
            site = getattr(user, 'owned_sites', None)
            if site:
                site = site.first()
            else:
                return Response({
                    'error': 'У пользователя нет доступных сайтов'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Для суперадмина нужно указать сайт в параметрах
            site_id = request.data.get('site_id')
            if not site_id:
                return Response({
                    'error': 'Необходимо указать site_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            from apps.sites.models import Site
            site = get_object_or_404(Site, id=site_id)
        
        try:
            with transaction.atomic():
                # Проверяем существование модели
                existing_model = DynamicModel.objects.filter(
                    site=site,
                    name=config_data['name']
                ).first()
                
                if existing_model and not override_existing:
                    return Response({
                        'error': f"Модель '{config_data['name']}' уже существует. Используйте override_existing=true для перезаписи"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Импортируем модель
                dynamic_model = DynamicModel.import_config(config_data, site, user)
                serializer_response = self.get_serializer(dynamic_model)
                
                return Response({
                    'status': 'success',
                    'message': 'Конфигурация успешно импортирована',
                    'model': serializer_response.data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class DynamicModelDataViewSet(viewsets.ModelViewSet):
    """ViewSet для управления данными динамических моделей"""
    
    queryset = DynamicModelData.objects.all()
    serializer_class = DynamicModelDataSerializer
    permission_classes = [IsAuthenticated, DynamicModelDataPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['data']  # Поиск по JSON данным
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_parsers(self):
        """Поддержка multipart/form-data для загрузки файлов"""
        from rest_framework.parsers import MultiPartParser, JSONParser, FormParser
        
        if self.action in ['create', 'update', 'partial_update']:
            return [MultiPartParser(), FormParser(), JSONParser()]
        return super().get_parsers()
    
    def get_queryset(self):
        """Фильтруем данные по доступным пользователю моделям"""
        user = self.request.user
        user_role = user.role.name if hasattr(user, 'role') and user.role else None
        
        queryset = self.queryset
        
        # Кастомная фильтрация
        dynamic_model = self.request.query_params.get('dynamic_model')
        if dynamic_model:
            queryset = queryset.filter(dynamic_model_id=dynamic_model)
        
        is_published = self.request.query_params.get('is_published')
        if is_published is not None:
            queryset = queryset.filter(is_published=is_published.lower() == 'true')
        
        # Фильтрация по правам доступа
        if user_role == 'superuser':
            return queryset
        elif user_role == 'admin':
            return queryset.filter(dynamic_model__site__owner=user)
        elif user_role == 'author':
            return queryset.filter(dynamic_model__site__assigned_users=user)
        
        return queryset.none()
    
    def perform_create(self, serializer):
        """При создании данных проверяем права доступа к модели"""
        dynamic_model = serializer.validated_data['dynamic_model']
        
        # Проверяем доступ к модели
        user_role = self.request.user.role.name if hasattr(self.request.user, 'role') and self.request.user.role else None
        
        if user_role == 'admin':
            if dynamic_model.site.owner != self.request.user:
                raise PermissionError("Нет доступа к данной модели")
        elif user_role == 'author':
            if self.request.user not in dynamic_model.site.assigned_users.all():
                raise PermissionError("Нет доступа к данной модели")
        
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def schema(self, request):
        """Возвращает схему полей для указанной динамической модели"""
        dynamic_model_id = request.query_params.get('dynamic_model')
        if not dynamic_model_id:
            return Response({
                'error': 'Необходимо указать параметр dynamic_model'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dynamic_model = DynamicModel.objects.get(id=dynamic_model_id)
            
            # Проверяем доступ
            user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
            
            if user_role == 'admin' and dynamic_model.site.owner != request.user:
                return Response({
                    'error': 'Нет доступа к данной модели'
                }, status=status.HTTP_403_FORBIDDEN)
            elif user_role == 'author' and request.user not in dynamic_model.site.assigned_users.all():
                return Response({
                    'error': 'Нет доступа к данной модели'
                }, status=status.HTTP_403_FORBIDDEN)
            
            schema = {
                'model_info': {
                    'id': dynamic_model.id,
                    'name': dynamic_model.name,
                    'description': dynamic_model.description,
                    'model_type': dynamic_model.model_type,
                    'table_name': dynamic_model.table_name
                },
                'fields': dynamic_model.fields_config.get('fields', []),
                'validation_rules': dynamic_model.validation_rules
            }
            
            return Response(schema)
            
        except DynamicModel.DoesNotExist:
            return Response({
                'error': 'Динамическая модель не найдена'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Массовое создание записей"""
        dynamic_model_id = request.data.get('dynamic_model')
        entries_data = request.data.get('entries', [])
        
        if not dynamic_model_id or not entries_data:
            return Response({
                'error': 'Необходимо указать dynamic_model и entries'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dynamic_model = DynamicModel.objects.get(id=dynamic_model_id)
            
            created_entries = []
            errors = []
            
            with transaction.atomic():
                for i, entry_data in enumerate(entries_data):
                    serializer = self.get_serializer(data={
                        'dynamic_model': dynamic_model_id,
                        'data': entry_data,
                        'is_published': request.data.get('is_published', True)
                    })
                    
                    if serializer.is_valid():
                        entry = serializer.save()
                        created_entries.append(entry.id)
                    else:
                        errors.append({
                            'index': i,
                            'errors': serializer.errors
                        })
                
                if errors:
                    # Если есть ошибки, откатываем транзакцию
                    raise Exception("Validation errors")
            
            return Response({
                'status': 'success',
                'created_count': len(created_entries),
                'created_ids': created_entries
            })
            
        except DynamicModel.DoesNotExist:
            return Response({
                'error': 'Динамическая модель не найдена'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Ошибка при создании записей',
                'validation_errors': errors if 'errors' in locals() else []
            }, status=status.HTTP_400_BAD_REQUEST)

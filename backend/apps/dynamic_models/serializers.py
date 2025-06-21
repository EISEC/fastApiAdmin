from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import (
    DynamicModel, 
    DynamicModelData,
    DynamicModelVersion,
    DynamicFieldType,
    DynamicModelExtension,
    DynamicModelPermission
)


class DynamicFieldTypeSerializer(serializers.ModelSerializer):
    """Сериализатор для типов полей"""
    
    class Meta:
        model = DynamicFieldType
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DynamicModelVersionSerializer(serializers.ModelSerializer):
    """Сериализатор для версий моделей"""
    
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    parent_version_name = serializers.CharField(source='parent_version.name', read_only=True)
    
    class Meta:
        model = DynamicModelVersion
        fields = '__all__'
        read_only_fields = ['created_at']


class DynamicModelExtensionSerializer(serializers.ModelSerializer):
    """Сериализатор для расширений моделей"""
    
    target_model_info = serializers.SerializerMethodField()
    
    class Meta:
        model = DynamicModelExtension
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_target_model_info(self, obj):
        """Получает информацию о целевой модели"""
        target_class = obj.get_target_model_class()
        if target_class:
            return {
                'name': target_class.__name__,
                'app_label': target_class._meta.app_label,
                'verbose_name': target_class._meta.verbose_name,
                'fields': [field.name for field in target_class._meta.fields]
            }
        return None


class DynamicModelPermissionSerializer(serializers.ModelSerializer):
    """Сериализатор для разрешений"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = DynamicModelPermission
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Валидация: должен быть указан либо пользователь, либо роль"""
        if not data.get('user') and not data.get('role'):
            raise serializers.ValidationError("Необходимо указать либо пользователя, либо роль")
        
        if data.get('user') and data.get('role'):
            raise serializers.ValidationError("Нельзя указывать одновременно пользователя и роль")
        
        return data


class DynamicModelSerializer(serializers.ModelSerializer):
    """Сериализатор для динамических моделей"""
    
    site_name = serializers.CharField(source='site.name', read_only=True)
    fields_count = serializers.SerializerMethodField()
    data_entries_count = serializers.SerializerMethodField()
    latest_version = serializers.SerializerMethodField()
    extension_config = DynamicModelExtensionSerializer(read_only=True)
    version_history = DynamicModelVersionSerializer(many=True, read_only=True)
    custom_permissions = DynamicModelPermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = DynamicModel
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'table_name']
    
    def get_fields_count(self, obj):
        """Возвращает количество полей в модели"""
        if obj.fields_config and 'fields' in obj.fields_config:
            return len(obj.fields_config['fields'])
        return 0
    
    def get_data_entries_count(self, obj):
        """Возвращает количество записей данных"""
        return obj.data_entries.filter(is_published=True).count()
    
    def get_latest_version(self, obj):
        """Возвращает информацию о последней версии"""
        latest = obj.get_latest_version()
        if latest and latest != obj:
            return {
                'version': latest.version,
                'id': latest.id,
                'is_current': False
            }
        return {
            'version': obj.version,
            'id': obj.id,
            'is_current': True
        }
    
    def validate_fields_config(self, value):
        """Валидация конфигурации полей"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Конфигурация полей должна быть объектом")
        
        if 'fields' not in value:
            raise serializers.ValidationError("Конфигурация должна содержать массив 'fields'")
        
        fields = value['fields']
        if not isinstance(fields, list):
            raise serializers.ValidationError("'fields' должен быть массивом")
        
        # Проверяем каждое поле
        field_names = []
        for field in fields:
            if not isinstance(field, dict):
                raise serializers.ValidationError("Каждое поле должно быть объектом")
            
            # Проверяем обязательные ключи
            required_keys = ['name', 'type', 'label']
            for key in required_keys:
                if key not in field:
                    raise serializers.ValidationError(f"Поле должно содержать ключ '{key}'")
            
            # Проверяем уникальность имен полей
            field_name = field['name']
            if field_name in field_names:
                raise serializers.ValidationError(f"Дублирование имени поля: {field_name}")
            field_names.append(field_name)
            
            # Проверяем тип поля
            field_type = field['type']
            valid_types = [choice[0] for choice in DynamicModel.FIELD_TYPES]
            if field_type not in valid_types:
                raise serializers.ValidationError(f"Неподдерживаемый тип поля: {field_type}")
        
        return value
    
    def validate(self, data):
        """Дополнительная валидация модели"""
        # Проверяем расширения
        model_type = data.get('model_type')
        target_model = data.get('target_model')
        
        if model_type == 'extension':
            if not target_model:
                raise serializers.ValidationError({
                    'target_model': "Для расширения модели необходимо указать целевую модель"
                })
            
            # Проверяем формат целевой модели
            if '.' not in target_model:
                raise serializers.ValidationError({
                    'target_model': "Целевая модель должна быть в формате 'app.Model'"
                })
        
        elif model_type == 'standalone':
            # Для отдельной модели очищаем target_model если он был указан
            if target_model:
                data['target_model'] = None
        
        # Проверяем уникальность имени для сайта только если эти поля действительно изменяются
        site = data.get('site')
        name = data.get('name')
        
        # При обновлении проверяем только если site или name изменились
        if self.instance:  # Это обновление
            current_site = self.instance.site_id if hasattr(self.instance, 'site_id') else self.instance.site.id
            current_name = self.instance.name
            
            # Проверяем уникальность только если изменились site или name
            if (site and site != current_site) or (name and name != current_name):
                check_site = site if site else current_site
                check_name = name if name else current_name
                version = data.get('version', self.instance.version)
                
                existing = DynamicModel.objects.filter(
                    site=check_site,
                    name=check_name,
                    version=version
                ).exclude(id=self.instance.id)
                
                if existing.exists():
                    raise serializers.ValidationError({
                        'name': f"Модель с именем '{check_name}' версии {version} уже существует для выбранного сайта"
                    })
        
        else:  # Это создание новой модели
            if site and name:
                version = data.get('version', 1)
                existing = DynamicModel.objects.filter(
                    site=site,
                    name=name,
                    version=version
                )
                
                if existing.exists():
                    raise serializers.ValidationError({
                        'name': f"Модель с именем '{name}' версии {version} уже существует для этого сайта"
                    })
        
        return data


class DynamicModelDataSerializer(serializers.ModelSerializer):
    """Сериализатор для данных динамических моделей"""
    
    dynamic_model_name = serializers.CharField(source='dynamic_model.name', read_only=True)
    display_value = serializers.CharField(source='get_display_value', read_only=True)
    
    class Meta:
        model = DynamicModelData
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def to_internal_value(self, data):
        """Обработка входящих данных с поддержкой файлов"""
        # Получаем модель для определения типов полей
        dynamic_model = None
        if 'dynamic_model' in data:
            try:
                dynamic_model = DynamicModel.objects.get(id=data['dynamic_model'])
            except DynamicModel.DoesNotExist:
                pass
        elif self.instance:
            dynamic_model = self.instance.dynamic_model
        
        # Обрабатываем файлы и изображения
        if dynamic_model and 'data' in data:
            processed_data = self._process_file_fields(data['data'], dynamic_model)
            data = data.copy()
            data['data'] = processed_data
        
        return super().to_internal_value(data)
    
    def _process_file_fields(self, data, dynamic_model):
        """Обработка полей с файлами и изображениями"""
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os
        import uuid
        
        fields_config = dynamic_model.fields_config
        if not fields_config or 'fields' not in fields_config:
            return data
        
        processed_data = data.copy()
        
        for field_config in fields_config['fields']:
            field_name = field_config['name']
            field_type = field_config['type']
            
            # Обрабатываем только поля файлов и изображений
            if field_type in ['file', 'image', 'gallery'] and field_name in processed_data:
                field_value = processed_data[field_name]
                
                # Если это файл из формы
                if hasattr(field_value, 'read'):
                    # Генерируем уникальное имя файла
                    file_extension = os.path.splitext(field_value.name)[1]
                    unique_filename = f"{uuid.uuid4()}{file_extension}"
                    
                    # Определяем папку для сохранения
                    upload_folder = 'images' if field_type == 'image' else 'files'
                    file_path = f"dynamic_models/{dynamic_model.site.id}/{dynamic_model.id}/{upload_folder}/{unique_filename}"
                    
                    # Сохраняем файл
                    saved_path = default_storage.save(file_path, ContentFile(field_value.read()))
                    
                    # Сохраняем путь к файлу в данных
                    processed_data[field_name] = {
                        'url': default_storage.url(saved_path),
                        'path': saved_path,
                        'name': field_value.name,
                        'size': field_value.size if hasattr(field_value, 'size') else None
                    }
                
                # Если это уже обработанный файл (при обновлении)
                elif isinstance(field_value, dict) and 'url' in field_value:
                    # Оставляем как есть
                    pass
                
                # Если это строка (URL существующего файла)
                elif isinstance(field_value, str) and field_value.startswith(('http', '/')):
                    # Оставляем как есть
                    pass
                
                # Если поле пустое
                elif not field_value:
                    processed_data[field_name] = None
        
        return processed_data
    
    def validate_data(self, value):
        """Валидация данных согласно схеме динамической модели"""
        dynamic_model = self.instance.dynamic_model if self.instance else None
        
        # При создании получаем модель из initial_data
        if not dynamic_model and 'dynamic_model' in self.initial_data:
            try:
                dynamic_model = DynamicModel.objects.get(id=self.initial_data['dynamic_model'])
            except DynamicModel.DoesNotExist:
                raise serializers.ValidationError("Динамическая модель не найдена")
        
        if not dynamic_model:
            return value
        
        # Валидируем данные согласно конфигурации модели
        fields_config = dynamic_model.fields_config
        if not fields_config or 'fields' not in fields_config:
            return value
        
        errors = {}
        
        for field_config in fields_config['fields']:
            field_name = field_config['name']
            field_type = field_config['type']
            is_required = field_config.get('required', False)
            field_label = field_config.get('label', field_name)
            
            # Проверка обязательности
            if is_required and (field_name not in value or not value[field_name]):
                errors[field_name] = f"Поле '{field_label}' обязательно для заполнения"
                continue
            
            # Проверка типов данных если значение не пустое
            if field_name in value and value[field_name] is not None and value[field_name] != '':
                field_value = value[field_name]
                
                # Валидация по типу поля
                try:
                    self._validate_field_type(field_value, field_type, field_label)
                except serializers.ValidationError as e:
                    errors[field_name] = str(e)
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return value
    
    def _validate_field_type(self, value, field_type, field_label):
        """Валидация значения по типу поля"""
        if field_type == 'number':
            try:
                float(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"Поле '{field_label}' должно быть числом")
        
        elif field_type == 'decimal':
            try:
                from decimal import Decimal
                Decimal(str(value))
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"Поле '{field_label}' должно быть десятичным числом")
        
        elif field_type == 'email':
            from django.core.validators import EmailValidator
            validator = EmailValidator()
            try:
                validator(value)
            except DjangoValidationError:
                raise serializers.ValidationError(f"Поле '{field_label}' должно содержать корректный email")
        
        elif field_type == 'url':
            from django.core.validators import URLValidator
            validator = URLValidator()
            try:
                validator(value)
            except DjangoValidationError:
                raise serializers.ValidationError(f"Поле '{field_label}' должно содержать корректный URL")
        
        elif field_type == 'phone':
            import re
            phone_pattern = r'^\+?1?\d{9,15}$'
            if not re.match(phone_pattern, str(value).replace(' ', '').replace('-', '')):
                raise serializers.ValidationError(f"Поле '{field_label}' должно содержать корректный номер телефона")
        
        elif field_type == 'date':
            from datetime import datetime
            try:
                if isinstance(value, str):
                    datetime.strptime(value, '%Y-%m-%d')
            except ValueError:
                raise serializers.ValidationError(f"Поле '{field_label}' должно быть в формате YYYY-MM-DD")
        
        elif field_type == 'datetime':
            from datetime import datetime
            try:
                if isinstance(value, str):
                    datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                raise serializers.ValidationError(f"Поле '{field_label}' должно быть в формате ISO datetime")
        
        elif field_type == 'boolean':
            if not isinstance(value, bool) and value not in ['true', 'false', '1', '0', 1, 0]:
                raise serializers.ValidationError(f"Поле '{field_label}' должно быть булевым значением")


class DynamicModelConfigExportSerializer(serializers.Serializer):
    """Сериализатор для экспорта конфигурации модели"""
    
    include_data = serializers.BooleanField(default=False, help_text="Включить данные в экспорт")
    include_permissions = serializers.BooleanField(default=False, help_text="Включить настройки разрешений")
    
    def validate(self, data):
        return data


class DynamicModelConfigImportSerializer(serializers.Serializer):
    """Сериализатор для импорта конфигурации модели"""
    
    config_data = serializers.JSONField(help_text="JSON конфигурация модели")
    override_existing = serializers.BooleanField(default=False, help_text="Перезаписать существующую модель")
    import_data = serializers.BooleanField(default=False, help_text="Импортировать данные")
    
    def validate_config_data(self, value):
        """Валидация конфигурационных данных"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Конфигурация должна быть объектом")
        
        required_fields = ['name', 'fields_config']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Отсутствует обязательное поле: {field}")
        
        return value 
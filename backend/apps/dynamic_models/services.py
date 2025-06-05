from typing import Dict, List, Any, Optional
from django.core.exceptions import ValidationError
from django.db import transaction
from django.apps import apps
from .models import DynamicModel, DynamicModelData, DynamicFieldType, DynamicModelExtension


class DynamicModelService:
    """Сервис для работы с динамическими моделями"""
    
    @staticmethod
    def create_model(name: str, site, fields_config: Dict, model_type: str = 'standalone', 
                    target_model: str = None, description: str = '', user=None) -> DynamicModel:
        """Создает новую динамическую модель"""
        
        with transaction.atomic():
            # Создаем модель
            dynamic_model = DynamicModel.objects.create(
                name=name,
                site=site,
                model_type=model_type,
                target_model=target_model,
                fields_config=fields_config,
                description=description
            )
            
            # Если это расширение, создаем конфигурацию расширения
            if model_type == 'extension' and target_model:
                DynamicModelExtension.objects.create(
                    dynamic_model=dynamic_model,
                    target_model=target_model,
                    extension_type='field_addition'
                )
            
            return dynamic_model
    
    @staticmethod
    def validate_fields_config(fields_config: Dict) -> List[str]:
        """Валидирует конфигурацию полей и возвращает список ошибок"""
        errors = []
        
        if not isinstance(fields_config, dict):
            errors.append("Конфигурация полей должна быть объектом")
            return errors
        
        if 'fields' not in fields_config:
            errors.append("Отсутствует массив 'fields'")
            return errors
        
        fields = fields_config['fields']
        if not isinstance(fields, list):
            errors.append("'fields' должен быть массивом")
            return errors
        
        if not fields:
            errors.append("Необходимо добавить хотя бы одно поле")
            return errors
        
        field_names = set()
        valid_types = [choice[0] for choice in DynamicModel.FIELD_TYPES]
        
        for i, field in enumerate(fields):
            field_prefix = f"Поле #{i+1}: "
            
            if not isinstance(field, dict):
                errors.append(f"{field_prefix}должно быть объектом")
                continue
            
            # Проверяем обязательные поля
            required_keys = ['name', 'type', 'label']
            for key in required_keys:
                if key not in field:
                    errors.append(f"{field_prefix}отсутствует обязательное поле '{key}'")
            
            # Проверяем уникальность имен
            field_name = field.get('name')
            if field_name:
                if field_name in field_names:
                    errors.append(f"{field_prefix}дублирование имени поля '{field_name}'")
                field_names.add(field_name)
                
                # Проверяем формат имени поля
                if not field_name.isidentifier():
                    errors.append(f"{field_prefix}имя поля '{field_name}' должно быть валидным идентификатором")
            
            # Проверяем тип поля
            field_type = field.get('type')
            if field_type and field_type not in valid_types:
                errors.append(f"{field_prefix}неподдерживаемый тип поля '{field_type}'")
            
            # Проверяем специфичные для типа поля параметры
            if field_type in ['select', 'multiselect', 'radio', 'checkbox']:
                options = field.get('options', [])
                if not options:
                    errors.append(f"{field_prefix}для типа '{field_type}' необходимо указать options")
                elif not isinstance(options, list):
                    errors.append(f"{field_prefix}options должен быть массивом")
        
        return errors
    
    @staticmethod
    def generate_form_schema(dynamic_model: DynamicModel) -> Dict:
        """Генерирует схему формы для фронтенда"""
        if not dynamic_model.fields_config or 'fields' not in dynamic_model.fields_config:
            return {'fields': []}
        
        fields = dynamic_model.fields_config['fields']
        form_fields = []
        
        for field in fields:
            form_field = {
                'name': field['name'],
                'label': field['label'],
                'type': field['type'],
                'required': field.get('required', False),
                'placeholder': field.get('placeholder', ''),
                'help_text': field.get('help_text', ''),
                'default_value': field.get('default_value'),
                'validation': DynamicValidationService.get_field_validation_rules(field)
            }
            
            # Добавляем специфичные для типа поля параметры
            if field['type'] in ['select', 'multiselect', 'radio', 'checkbox']:
                form_field['options'] = field.get('options', [])
            elif field['type'] == 'number':
                form_field['min'] = field.get('min')
                form_field['max'] = field.get('max')
                form_field['step'] = field.get('step', 1)
            elif field['type'] in ['text', 'textarea']:
                form_field['min_length'] = field.get('min_length')
                form_field['max_length'] = field.get('max_length')
            
            form_fields.append(form_field)
        
        return {
            'model_info': {
                'id': dynamic_model.id,
                'name': dynamic_model.name,
                'description': dynamic_model.description
            },
            'fields': form_fields
        }


class DynamicValidationService:
    """Сервис для валидации данных динамических моделей"""
    
    @staticmethod
    def validate_data(dynamic_model: DynamicModel, data: Dict) -> List[str]:
        """Валидирует данные согласно схеме модели"""
        errors = []
        
        if not dynamic_model.fields_config or 'fields' not in dynamic_model.fields_config:
            return errors
        
        fields_config = dynamic_model.fields_config['fields']
        
        for field_config in fields_config:
            field_name = field_config['name']
            field_type = field_config['type']
            field_label = field_config.get('label', field_name)
            is_required = field_config.get('required', False)
            
            # Проверка обязательности
            if is_required:
                if field_name not in data or data[field_name] is None or data[field_name] == '':
                    errors.append(f"Поле '{field_label}' обязательно для заполнения")
                    continue
            
            # Если поле не заполнено и не обязательное, пропускаем валидацию
            if field_name not in data or data[field_name] is None or data[field_name] == '':
                continue
            
            # Валидация по типу поля
            field_errors = DynamicValidationService._validate_field_value(
                data[field_name], field_config, field_label
            )
            errors.extend(field_errors)
        
        return errors
    
    @staticmethod
    def _validate_field_value(value: Any, field_config: Dict, field_label: str) -> List[str]:
        """Валидирует значение конкретного поля"""
        errors = []
        field_type = field_config['type']
        
        try:
            if field_type == 'text':
                if not isinstance(value, str):
                    errors.append(f"Поле '{field_label}' должно быть строкой")
                else:
                    min_length = field_config.get('min_length')
                    max_length = field_config.get('max_length')
                    if min_length and len(value) < min_length:
                        errors.append(f"Поле '{field_label}' должно содержать минимум {min_length} символов")
                    if max_length and len(value) > max_length:
                        errors.append(f"Поле '{field_label}' должно содержать максимум {max_length} символов")
            
            elif field_type == 'number':
                try:
                    num_value = float(value)
                    min_val = field_config.get('min')
                    max_val = field_config.get('max')
                    if min_val is not None and num_value < min_val:
                        errors.append(f"Поле '{field_label}' должно быть не менее {min_val}")
                    if max_val is not None and num_value > max_val:
                        errors.append(f"Поле '{field_label}' должно быть не более {max_val}")
                except (ValueError, TypeError):
                    errors.append(f"Поле '{field_label}' должно быть числом")
            
            elif field_type == 'email':
                from django.core.validators import EmailValidator
                validator = EmailValidator()
                try:
                    validator(str(value))
                except ValidationError:
                    errors.append(f"Поле '{field_label}' должно содержать корректный email")
            
            elif field_type == 'url':
                from django.core.validators import URLValidator
                validator = URLValidator()
                try:
                    validator(str(value))
                except ValidationError:
                    errors.append(f"Поле '{field_label}' должно содержать корректный URL")
            
            elif field_type == 'select':
                options = field_config.get('options', [])
                valid_values = [opt.get('value') if isinstance(opt, dict) else opt for opt in options]
                if value not in valid_values:
                    errors.append(f"Поле '{field_label}' содержит недопустимое значение")
            
            elif field_type == 'multiselect':
                if not isinstance(value, list):
                    errors.append(f"Поле '{field_label}' должно быть массивом")
                else:
                    options = field_config.get('options', [])
                    valid_values = [opt.get('value') if isinstance(opt, dict) else opt for opt in options]
                    for val in value:
                        if val not in valid_values:
                            errors.append(f"Поле '{field_label}' содержит недопустимое значение: {val}")
            
            elif field_type == 'boolean':
                if not isinstance(value, bool) and value not in ['true', 'false', '1', '0', 1, 0]:
                    errors.append(f"Поле '{field_label}' должно быть булевым значением")
            
            elif field_type == 'date':
                from datetime import datetime
                try:
                    if isinstance(value, str):
                        datetime.strptime(value, '%Y-%m-%d')
                except ValueError:
                    errors.append(f"Поле '{field_label}' должно быть в формате YYYY-MM-DD")
            
            elif field_type == 'datetime':
                from datetime import datetime
                try:
                    if isinstance(value, str):
                        datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    errors.append(f"Поле '{field_label}' должно быть в формате ISO datetime")
        
        except Exception as e:
            errors.append(f"Ошибка валидации поля '{field_label}': {str(e)}")
        
        return errors
    
    @staticmethod
    def get_field_validation_rules(field_config: Dict) -> Dict:
        """Возвращает правила валидации для поля в формате для фронтенда"""
        field_type = field_config['type']
        rules = {
            'required': field_config.get('required', False)
        }
        
        if field_type in ['text', 'textarea']:
            if 'min_length' in field_config:
                rules['minLength'] = field_config['min_length']
            if 'max_length' in field_config:
                rules['maxLength'] = field_config['max_length']
        
        elif field_type == 'number':
            if 'min' in field_config:
                rules['min'] = field_config['min']
            if 'max' in field_config:
                rules['max'] = field_config['max']
        
        elif field_type == 'email':
            rules['pattern'] = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        
        elif field_type == 'url':
            rules['pattern'] = r'^https?:\/\/.+'
        
        return rules


class DynamicExportImportService:
    """Сервис для экспорта и импорта конфигураций"""
    
    @staticmethod
    def export_model_config(dynamic_model: DynamicModel, include_data: bool = False, 
                           include_permissions: bool = False) -> Dict:
        """Экспортирует конфигурацию модели"""
        
        config = {
            'version': '1.0',
            'model': {
                'name': dynamic_model.name,
                'description': dynamic_model.description,
                'model_type': dynamic_model.model_type,
                'target_model': dynamic_model.target_model,
                'fields_config': dynamic_model.fields_config,
                'validation_rules': dynamic_model.validation_rules,
            },
            'export_info': {
                'timestamp': dynamic_model.updated_at.isoformat() if dynamic_model.updated_at else None,
                'site_name': dynamic_model.site.name,
                'exported_by': 'system'
            }
        }
        
        if include_data:
            data_entries = dynamic_model.data_entries.filter(is_published=True).values(
                'data', 'created_at', 'updated_at'
            )
            config['data'] = list(data_entries)
        
        if include_permissions:
            permissions = dynamic_model.custom_permissions.filter(is_active=True).values(
                'permission_type', 'field_restrictions', 'conditions'
            )
            config['permissions'] = list(permissions)
        
        return config
    
    @staticmethod
    def import_model_config(config: Dict, site, user=None) -> DynamicModel:
        """Импортирует конфигурацию модели"""
        
        # Валидация конфигурации
        if 'model' not in config:
            raise ValidationError("Отсутствует секция 'model' в конфигурации")
        
        model_config = config['model']
        required_fields = ['name', 'fields_config']
        for field in required_fields:
            if field not in model_config:
                raise ValidationError(f"Отсутствует обязательное поле: {field}")
        
        # Валидация полей
        validation_errors = DynamicModelService.validate_fields_config(model_config['fields_config'])
        if validation_errors:
            raise ValidationError(f"Ошибки в конфигурации полей: {', '.join(validation_errors)}")
        
        with transaction.atomic():
            # Создаем модель
            dynamic_model = DynamicModel.objects.create(
                name=model_config['name'],
                site=site,
                description=model_config.get('description', ''),
                model_type=model_config.get('model_type', 'standalone'),
                target_model=model_config.get('target_model'),
                fields_config=model_config['fields_config'],
                validation_rules=model_config.get('validation_rules', {})
            )
            
            # Импортируем данные если есть
            if 'data' in config and config['data']:
                for entry_data in config['data']:
                    DynamicModelData.objects.create(
                        dynamic_model=dynamic_model,
                        data=entry_data['data'],
                        is_published=True
                    )
            
            return dynamic_model


class DynamicPermissionService:
    """Сервис для работы с разрешениями динамических моделей"""
    
    @staticmethod
    def check_user_permission(user, dynamic_model: DynamicModel, permission_type: str, 
                             field_name: str = None) -> bool:
        """Проверяет разрешение пользователя на действие с моделью"""
        
        # Базовые проверки роли
        user_role = user.role.name if hasattr(user, 'role') and user.role else None
        
        if user_role == 'superuser':
            return True
        
        if user_role == 'admin' and dynamic_model.site.owner == user:
            return True
        
        if user_role == 'author' and user in dynamic_model.site.assigned_users.all():
            # Авторы могут только просматривать и добавлять данные
            return permission_type in ['view', 'add']
        
        # Проверяем кастомные разрешения
        custom_permissions = dynamic_model.custom_permissions.filter(
            is_active=True,
            permission_type=permission_type
        )
        
        for permission in custom_permissions:
            if permission.check_permission(user, field_name):
                return True
        
        return False
    
    @staticmethod
    def get_user_accessible_fields(user, dynamic_model: DynamicModel) -> List[str]:
        """Возвращает список полей, к которым у пользователя есть доступ"""
        
        # Получаем все поля модели
        all_fields = dynamic_model.get_field_names()
        
        if not all_fields:
            return []
        
        # Проверяем ограничения доступа к полям
        accessible_fields = []
        
        for field_name in all_fields:
            if DynamicPermissionService.check_user_permission(user, dynamic_model, 'view', field_name):
                accessible_fields.append(field_name)
        
        return accessible_fields 
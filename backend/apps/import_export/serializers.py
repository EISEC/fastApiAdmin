from rest_framework import serializers
from .models import ImportSource, ImportJob, ImportMapping, ImportLog
from apps.sites.serializers import SiteListSerializer


class ImportSourceSerializer(serializers.ModelSerializer):
    """Сериализатор источника импорта"""
    
    class Meta:
        model = ImportSource
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ImportMappingSerializer(serializers.ModelSerializer):
    """Сериализатор маппинга полей"""
    
    class Meta:
        model = ImportMapping
        fields = '__all__'


class ImportLogSerializer(serializers.ModelSerializer):
    """Сериализатор лога импорта"""
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    
    class Meta:
        model = ImportLog
        fields = '__all__'
        read_only_fields = ['created_at']


class ImportJobSerializer(serializers.ModelSerializer):
    """Сериализатор задачи импорта"""
    source_name = serializers.CharField(source='source.name', read_only=True)
    source_platform = serializers.CharField(source='source.get_platform_display', read_only=True)
    target_site_name = serializers.CharField(source='target_site.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    
    # Связанные объекты
    target_site = SiteListSerializer(read_only=True)
    field_mappings = ImportMappingSerializer(many=True, read_only=True)
    logs = ImportLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = ImportJob
        fields = '__all__'
        read_only_fields = [
            'created_by', 'progress', 'total_items', 'processed_items', 
            'imported_items', 'failed_items', 'results', 'errors',
            'started_at', 'completed_at', 'created_at', 'updated_at'
        ]
    
    def get_progress_percentage(self, obj):
        """Возвращает прогресс в процентах"""
        return obj.get_progress_percentage()
    
    def get_success_rate(self, obj):
        """Возвращает процент успешного импорта"""
        return obj.get_success_rate()
    
    def get_duration(self, obj):
        """Возвращает длительность выполнения в секундах"""
        if obj.started_at and obj.completed_at:
            return (obj.completed_at - obj.started_at).total_seconds()
        return None


class CreateImportJobSerializer(serializers.ModelSerializer):
    """Сериализатор для создания задачи импорта"""
    
    class Meta:
        model = ImportJob
        fields = [
            'name', 'source', 'target_site', 'content_types', 
            'import_settings', 'source_file'
        ]
    
    def validate_content_types(self, value):
        """Валидация типов контента"""
        valid_types = [choice[0] for choice in ImportJob.CONTENT_TYPE_CHOICES]
        for content_type in value:
            if content_type not in valid_types:
                raise serializers.ValidationError(
                    f"Недопустимый тип контента: {content_type}"
                )
        return value
    
    def validate_source_file(self, value):
        """Валидация файла источника"""
        if value:
            # Проверяем размер файла (максимум 100MB)
            if value.size > 100 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Размер файла не должен превышать 100MB"
                )
            
            # Проверяем расширение файла
            allowed_extensions = ['.xml', '.json', '.csv', '.zip']
            file_extension = '.' + value.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                raise serializers.ValidationError(
                    f"Неподдерживаемый тип файла. Разрешены: {', '.join(allowed_extensions)}"
                )
        
        return value


class WordPressImportSerializer(serializers.Serializer):
    """Сериализатор для импорта из WordPress"""
    name = serializers.CharField(max_length=255, help_text="Название задачи импорта")
    target_site = serializers.IntegerField(help_text="ID целевого сайта")
    
    # Источник данных
    source_type = serializers.ChoiceField(
        choices=[
            ('file', 'Файл WordPress XML'),
            ('api', 'WordPress REST API'),
            ('database', 'Прямое подключение к БД')
        ],
        help_text="Тип источника данных"
    )
    
    # Файл для импорта
    source_file = serializers.FileField(
        required=False,
        help_text="XML файл экспорта WordPress"
    )
    
    # API подключение
    wordpress_url = serializers.URLField(
        required=False,
        help_text="URL WordPress сайта для API импорта"
    )
    api_username = serializers.CharField(
        max_length=255, 
        required=False,
        help_text="Имя пользователя WordPress"
    )
    api_password = serializers.CharField(
        max_length=255, 
        required=False,
        help_text="Пароль приложения WordPress"
    )
    
    # Настройки импорта
    import_posts = serializers.BooleanField(default=True, help_text="Импортировать посты")
    import_pages = serializers.BooleanField(default=True, help_text="Импортировать страницы")
    import_categories = serializers.BooleanField(default=True, help_text="Импортировать категории")
    import_tags = serializers.BooleanField(default=True, help_text="Импортировать теги")
    import_media = serializers.BooleanField(default=False, help_text="Импортировать медиафайлы")
    
    # Дополнительные настройки
    preserve_ids = serializers.BooleanField(
        default=False, 
        help_text="Сохранить оригинальные ID (может вызвать конфликты)"
    )
    update_existing = serializers.BooleanField(
        default=False, 
        help_text="Обновлять существующие записи"
    )
    default_author = serializers.IntegerField(
        required=False,
        help_text="ID пользователя по умолчанию для постов"
    )
    
    def validate(self, data):
        """Валидация данных"""
        source_type = data.get('source_type')
        
        if source_type == 'file' and not data.get('source_file'):
            raise serializers.ValidationError({
                'source_file': 'Файл обязателен для импорта из файла'
            })
        
        if source_type == 'api':
            required_fields = ['wordpress_url', 'api_username', 'api_password']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({
                        field: f'Поле {field} обязательно для API импорта'
                    })
        
        return data 
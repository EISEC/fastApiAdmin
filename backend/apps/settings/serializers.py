from rest_framework import serializers
from .models import SettingCategory, SettingGroup, Setting, SettingTemplate, SocialNetworkSetting


class SettingSerializer(serializers.ModelSerializer):
    """Сериализатор для настроек"""
    
    class Meta:
        model = Setting
        fields = [
            'key', 'label', 'description', 'type', 'value', 'default_value',
            'group', 'is_required', 'is_readonly', 'validation_rules',
            'options', 'placeholder', 'help_text', 'help_url', 'order',
            'created_at', 'updated_at', 'updated_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'updated_by']

    def update(self, instance, validated_data):
        # Устанавливаем пользователя, который обновляет настройку
        if 'request' in self.context:
            validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class SettingGroupSerializer(serializers.ModelSerializer):
    """Сериализатор для групп настроек"""
    settings = SettingSerializer(many=True, read_only=True)
    
    class Meta:
        model = SettingGroup
        fields = [
            'id', 'name', 'description', 'icon', 'category', 'order',
            'is_active', 'created_at', 'updated_at', 'settings'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SettingCategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий настроек"""
    groups = SettingGroupSerializer(many=True, read_only=True)
    
    class Meta:
        model = SettingCategory
        fields = [
            'id', 'name', 'description', 'icon', 'order', 'is_active',
            'created_at', 'updated_at', 'groups'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SettingValueUpdateSerializer(serializers.Serializer):
    """Сериализатор для обновления значений настроек"""
    key = serializers.CharField()
    value = serializers.JSONField()

    def validate_key(self, value):
        """Проверяем что настройка существует"""
        try:
            Setting.objects.get(key=value)
        except Setting.DoesNotExist:
            raise serializers.ValidationError(f"Настройка с ключом '{value}' не найдена")
        return value


class BulkSettingsUpdateSerializer(serializers.Serializer):
    """Сериализатор для массового обновления настроек"""
    updates = SettingValueUpdateSerializer(many=True)

    def validate_updates(self, value):
        """Проверяем уникальность ключей в запросе"""
        keys = [item['key'] for item in value]
        if len(keys) != len(set(keys)):
            raise serializers.ValidationError("Дублирующиеся ключи настроек в запросе")
        return value


class SettingTemplateSerializer(serializers.ModelSerializer):
    """Сериализатор для шаблонов настроек"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = SettingTemplate
        fields = [
            'id', 'name', 'description', 'settings_data', 'is_public',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SettingsExportSerializer(serializers.Serializer):
    """Сериализатор для экспорта настроек"""
    categories = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Список ID категорий для экспорта"
    )
    include_defaults = serializers.BooleanField(
        default=False,
        help_text="Включить значения по умолчанию"
    )
    format = serializers.ChoiceField(
        choices=['json', 'yaml'],
        default='json',
        help_text="Формат экспорта"
    )


class SettingsImportSerializer(serializers.Serializer):
    """Сериализатор для импорта настроек"""
    data = serializers.JSONField(help_text="Данные настроек для импорта")
    overwrite_existing = serializers.BooleanField(
        default=True,
        help_text="Перезаписать существующие настройки"
    )
    create_missing = serializers.BooleanField(
        default=False,
        help_text="Создать отсутствующие настройки"
    )


class SocialNetworkSettingSerializer(serializers.ModelSerializer):
    """Сериализатор для настроек социальных сетей"""
    icon_name = serializers.CharField(source='get_icon_name', read_only=True)
    social_name = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = SocialNetworkSetting
        fields = [
            'id', 'name', 'social_name', 'url', 'is_enabled', 
            'order', 'icon_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def validate_url(self, value):
        """Валидация URL социальной сети"""
        if not value:
            raise serializers.ValidationError("URL обязателен")
        
        # Можно добавить специфические проверки для каждой соц.сети
        return value 
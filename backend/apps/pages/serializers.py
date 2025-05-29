from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Page
from apps.sites.models import Site

User = get_user_model()


class PageListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка страниц"""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    
    class Meta:
        model = Page
        fields = [
            'id', 'title', 'slug', 'template_name', 'is_published',
            'author', 'author_name', 'site', 'site_name',
            'is_homepage', 'sort_order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'slug']


class PageDetailSerializer(serializers.ModelSerializer):
    """Подробный сериализатор для страницы"""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    compiled_html = serializers.SerializerMethodField()
    
    class Meta:
        model = Page
        fields = '__all__'
        read_only_fields = [
            'author', 'slug', 'compiled_css', 'created_at', 'updated_at'
        ]
    
    def get_compiled_html(self, obj):
        """Получаем скомпилированный HTML"""
        return obj.compile_components_to_html()
    
    def validate_site(self, value):
        """Проверяем, что пользователь имеет доступ к сайту"""
        user = self.context['request'].user
        
        # Проверка для анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            raise serializers.ValidationError("Необходима авторизация")
        
        if user.role.name == 'superuser':
            return value
        elif user.role.name == 'admin' and value.owner != user:
            raise serializers.ValidationError("У вас нет прав на этот сайт")
        elif user.role.name == 'author' and user not in value.assigned_users.all():
            raise serializers.ValidationError("У вас нет прав на этот сайт")
        
        return value
    
    def validate_is_homepage(self, value):
        """Проверяем, что только одна страница может быть главной на сайте"""
        if value and self.instance:
            site = self.instance.site
            existing_home = Page.objects.filter(site=site, is_homepage=True).exclude(pk=self.instance.pk)
            if existing_home.exists():
                raise serializers.ValidationError("На сайте уже есть главная страница")
        
        return value


class PageCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления страниц"""
    
    class Meta:
        model = Page
        fields = [
            'title', 'template_name', 'page_components', 'site', 'is_published',
            'is_homepage', 'content', 'meta_title', 'meta_description', 'meta_keywords',
            'sort_order'
        ]
    
    def validate_site(self, value):
        """Проверяем права доступа к сайту"""
        user = self.context['request'].user
        
        # Проверка для анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            raise serializers.ValidationError("Необходима авторизация")
        
        if user.role.name == 'superuser':
            return value
        elif user.role.name == 'admin' and value.owner != user:
            raise serializers.ValidationError("У вас нет прав на этот сайт")
        elif user.role.name == 'author' and user not in value.assigned_users.all():
            raise serializers.ValidationError("У вас нет прав на этот сайт")
        
        return value
    
    def validate_is_homepage(self, value):
        """Проверяем, что только одна страница может быть главной на сайте"""
        if value:
            site = self.validated_data.get('site') or (self.instance and self.instance.site)
            if site:
                existing_home = Page.objects.filter(site=site, is_homepage=True)
                if self.instance:
                    existing_home = existing_home.exclude(pk=self.instance.pk)
                if existing_home.exists():
                    raise serializers.ValidationError("На сайте уже есть главная страница")
        
        return value
    
    def create(self, validated_data):
        """Создание страницы с автоматическим назначением автора"""
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PageStatsSerializer(serializers.ModelSerializer):
    """Сериализатор для статистики страницы"""
    
    class Meta:
        model = Page
        fields = ['id', 'title', 'created_at', 'updated_at']
        read_only_fields = fields


class PagePreviewSerializer(serializers.ModelSerializer):
    """Сериализатор для предварительного просмотра страницы"""
    
    compiled_html = serializers.SerializerMethodField()
    compiled_css = serializers.CharField(read_only=True)
    
    def get_compiled_html(self, obj):
        """Получаем скомпилированный HTML"""
        return obj.compile_components_to_html()
    
    class Meta:
        model = Page
        fields = ['id', 'title', 'compiled_html', 'compiled_css']
        read_only_fields = fields 
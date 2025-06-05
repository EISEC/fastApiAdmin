from rest_framework import serializers
from django.contrib.auth import get_user_model
from taggit.serializers import TagListSerializerField, TaggitSerializer
from .models import Post, Category, Tag
from apps.sites.models import Site

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий"""
    posts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'site', 'parent', 'color',
            'order', 'is_active', 'created_at', 'updated_at', 'posts_count'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at', 'posts_count']
    
    def get_posts_count(self, obj):
        return obj.posts.filter(status='published').count()


class TagSerializer(serializers.ModelSerializer):
    """Сериализатор для тегов"""
    posts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = [
            'id', 'name', 'slug', 'site', 'color', 
            'created_at', 'updated_at', 'posts_count'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at', 'posts_count']
    
    def get_posts_count(self, obj):
        return obj.posts.filter(status='published').count()


class PostListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка постов"""
    author_name = serializers.CharField(source='author.username', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags_list = TagSerializer(source='tags', many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'status', 'visibility', 'site', 'site_name',
            'author', 'author_name', 'category', 'category_name', 'tags_list',
            'featured_image', 'published_at', 'created_at', 'updated_at',
            'views_count', 'is_featured', 'comments_count', 'categories', 'tags'
        ]
    
    def get_comments_count(self, obj):
        # Пока возвращаем 0, когда будет система комментариев - обновим
        return 0
    
    def get_categories(self, obj):
        # Возвращаем категорию как массив для совместимости с frontend
        if obj.category:
            return [CategorySerializer(obj.category).data]
        return []


class PostDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра поста"""
    author_name = serializers.CharField(source='author.username', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    category_data = CategorySerializer(source='category', read_only=True)
    tags_data = TagSerializer(source='tags', many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 'status', 'visibility',
            'site', 'site_name', 'author', 'author_name', 
            'category', 'category_data', 'tags', 'tags_data',
            'meta_title', 'meta_description', 'meta_keywords', 'featured_image',
            'published_at', 'created_at', 'updated_at',
            'views_count', 'is_featured', 'allow_comments',
            'comments_count', 'categories'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at', 'views_count']
    
    def get_comments_count(self, obj):
        # Пока возвращаем 0, когда будет система комментариев - обновим
        return 0
    
    def get_categories(self, obj):
        # Возвращаем категорию как массив для совместимости с frontend
        if obj.category:
            return [CategorySerializer(obj.category).data]
        return []
    
    def create(self, validated_data):
        # Устанавливаем автора как текущего пользователя
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления постов"""
    categories = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Список ID категорий"
    )
    tags = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Список ID тегов"
    )
    
    class Meta:
        model = Post
        fields = [
            'title', 'slug', 'content', 'excerpt', 'status', 'visibility',
            'site', 'category', 'tags', 'categories',
            'meta_title', 'meta_description', 'meta_keywords', 'featured_image',
            'published_at', 'is_featured', 'allow_comments'
        ]
    
    def create(self, validated_data):
        # Извлекаем теги и категории
        tags_data = validated_data.pop('tags', [])
        categories_data = validated_data.pop('categories', [])
        
        # Устанавливаем автора как текущего пользователя
        validated_data['author'] = self.context['request'].user
        
        # Создаем пост
        post = super().create(validated_data)
        
        # Устанавливаем теги
        if tags_data:
            post.tags.set(tags_data)
            
        # Устанавливаем категорию (берем первую из categories, если есть)
        if categories_data and not validated_data.get('category'):
            post.category_id = categories_data[0]
            post.save()
        
        return post
    
    def update(self, instance, validated_data):
        # Извлекаем теги и категории
        tags_data = validated_data.pop('tags', None)
        categories_data = validated_data.pop('categories', None)
        
        # Обновляем основные поля
        instance = super().update(instance, validated_data)
        
        # Обновляем теги, если переданы
        if tags_data is not None:
            instance.tags.set(tags_data)
            
        # Обновляем категорию, если переданы
        if categories_data is not None and categories_data:
            instance.category_id = categories_data[0]
            instance.save()
        elif categories_data is not None and not categories_data:
            # Если передан пустой массив - очищаем категорию
            instance.category = None
            instance.save()
        
        return instance
    
    def validate_slug(self, value):
        """Проверяем уникальность slug в рамках сайта"""
        site = self.initial_data.get('site') or (self.instance.site.id if self.instance else None)
        if site:
            queryset = Post.objects.filter(site_id=site, slug=value)
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError("Пост с таким slug уже существует на данном сайте.")
        return value
    
    def validate_categories(self, value):
        """Проверяем что категории существуют"""
        if value:
            site = self.initial_data.get('site')
            if site:
                valid_categories = Category.objects.filter(site_id=site, id__in=value)
                if len(valid_categories) != len(value):
                    raise serializers.ValidationError("Некоторые категории не найдены или не принадлежат данному сайту.")
        return value
    
    def validate_tags(self, value):
        """Проверяем что теги существуют"""
        if value:
            site = self.initial_data.get('site')
            if site:
                valid_tags = Tag.objects.filter(site_id=site, id__in=value)
                if len(valid_tags) != len(value):
                    raise serializers.ValidationError("Некоторые теги не найдены или не принадлежат данному сайту.")
        return value


class PostStatsSerializer(serializers.ModelSerializer):
    """Сериализатор для статистики поста"""
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'views_count', 'reading_time', 'created_at', 'updated_at']
        read_only_fields = fields 
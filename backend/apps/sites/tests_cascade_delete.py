from django.test import TestCase
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.accounts.models import Role
from apps.sites.models import Site
from apps.posts.models import Post, Category, Tag
from apps.pages.models import Page
from apps.dynamic_models.models import DynamicModel
from apps.sites.signals import cascade_delete_site_with_transaction

User = get_user_model()


class CascadeDeleteSiteTestCase(TestCase):
    """Тесты для каскадного удаления сайтов"""
    
    def setUp(self):
        """Подготовка тестовых данных"""
        # Создаем роли
        self.superuser_role = Role.objects.create(name='superuser')
        self.admin_role = Role.objects.create(name='admin')
        self.author_role = Role.objects.create(name='author')
        
        # Создаем пользователей
        self.superuser = User.objects.create_user(
            username='superuser',
            email='super@example.com',
            role=self.superuser_role
        )
        
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            role=self.admin_role
        )
        
        self.author = User.objects.create_user(
            username='author',
            email='author@example.com',
            role=self.author_role
        )
        
        # Создаем сайт
        self.site = Site.objects.create(
            name='Тестовый сайт',
            domain='test.example.com',
            owner=self.admin
        )
        
        # Назначаем автора на сайт
        self.site.assigned_users.add(self.author)
        
        # Создаем тестовый контент
        self.create_test_content()
    
    def create_test_content(self):
        """Создаем тестовый контент для сайта"""
        # Категории
        self.category1 = Category.objects.create(
            name='Категория 1',
            slug='category-1',
            site=self.site
        )
        self.category2 = Category.objects.create(
            name='Категория 2',
            slug='category-2',
            site=self.site
        )
        
        # Теги
        self.tag1 = Tag.objects.create(
            name='Тег 1',
            slug='tag-1',
            site=self.site
        )
        self.tag2 = Tag.objects.create(
            name='Тег 2',
            slug='tag-2',
            site=self.site
        )
        
        # Посты
        self.post1 = Post.objects.create(
            title='Пост 1',
            slug='post-1',
            content='Содержание поста 1',
            site=self.site,
            author=self.author,
            category=self.category1,
            status='published'
        )
        self.post1.tags.add(self.tag1, self.tag2)
        
        self.post2 = Post.objects.create(
            title='Пост 2',
            slug='post-2',
            content='Содержание поста 2',
            site=self.site,
            author=self.author,
            category=self.category2,
            status='draft'
        )
        self.post2.tags.add(self.tag1)
        
        # Страницы
        self.page1 = Page.objects.create(
            title='Страница 1',
            slug='page-1',
            content='<h1>Страница 1</h1>',
            site=self.site,
            author=self.author,
            is_published=True
        )
        
        self.page2 = Page.objects.create(
            title='Страница 2',
            slug='page-2',
            content='<h1>Страница 2</h1>',
            site=self.site,
            author=self.author,
            is_published=False,
            is_homepage=True
        )
        
        # Динамические модели
        self.dynamic_model = DynamicModel.objects.create(
            name='Тестовая модель',
            site=self.site,
            model_type='standalone',
            table_name='test_model_unique',
            fields_config={
                'fields': [
                    {
                        'name': 'title',
                        'type': 'text',
                        'label': 'Заголовок',
                        'required': True,
                        'max_length': 255
                    },
                    {
                        'name': 'content',
                        'type': 'textarea',
                        'label': 'Содержание',
                        'required': False
                    }
                ]
            }
        )
    
    def test_cascade_delete_removes_all_dependencies(self):
        """Тест: каскадное удаление удаляет все зависимости"""
        site_id = self.site.id
        
        # Проверяем, что объекты существуют
        self.assertTrue(Site.objects.filter(id=site_id).exists())
        self.assertEqual(Post.objects.filter(site=self.site).count(), 2)
        self.assertEqual(Page.objects.filter(site=self.site).count(), 2)
        self.assertEqual(Category.objects.filter(site=self.site).count(), 2)
        self.assertEqual(Tag.objects.filter(site=self.site).count(), 2)
        self.assertEqual(DynamicModel.objects.filter(site=self.site).count(), 1)
        
        # Выполняем каскадное удаление
        result = cascade_delete_site_with_transaction(site_id)
        
        # Проверяем результат
        self.assertTrue(result['success'])
        self.assertEqual(result['posts_deleted'], 2)
        self.assertEqual(result['pages_deleted'], 2)
        self.assertEqual(result['categories_deleted'], 2)
        self.assertEqual(result['tags_deleted'], 2)
        self.assertEqual(result['dynamic_models_deleted'], 1)
        self.assertEqual(result['assigned_users_cleared'], 1)
        
        # Проверяем, что все объекты удалены
        self.assertFalse(Site.objects.filter(id=site_id).exists())
        self.assertEqual(Post.objects.filter(site_id=site_id).count(), 0)
        self.assertEqual(Page.objects.filter(site_id=site_id).count(), 0)
        self.assertEqual(Category.objects.filter(site_id=site_id).count(), 0)
        self.assertEqual(Tag.objects.filter(site_id=site_id).count(), 0)
        self.assertEqual(DynamicModel.objects.filter(site_id=site_id).count(), 0)
        
        # Проверяем, что пользователи не удалены
        self.assertTrue(User.objects.filter(id=self.admin.id).exists())
        self.assertTrue(User.objects.filter(id=self.author.id).exists())
    
    def test_cascade_delete_clears_user_assignments(self):
        """Тест: каскадное удаление очищает назначения пользователей"""
        # Проверяем, что автор назначен на сайт
        self.assertIn(self.author, self.site.assigned_users.all())
        
        # Выполняем каскадное удаление
        result = cascade_delete_site_with_transaction(self.site.id)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['assigned_users_cleared'], 1)
        
        # Проверяем, что связи M2M очищены
        # (Невозможно проверить после удаления сайта, но проверяем статистику)
        self.assertTrue(result['assigned_users_cleared'] > 0)
    
    def test_cascade_delete_preserves_user_main_site_reference(self):
        """Тест: каскадное удаление сохраняет ссылку пользователя на основной сайт как NULL"""
        # Устанавливаем сайт как основной для автора
        self.author.site = self.site
        self.author.save()
        
        site_id = self.site.id
        
        # Выполняем каскадное удаление
        result = cascade_delete_site_with_transaction(site_id)
        
        self.assertTrue(result['success'])
        
        # Проверяем, что пользователь не удален, но ссылка на сайт обнулена
        self.author.refresh_from_db()
        self.assertIsNone(self.author.site)
    
    def test_cascade_delete_nonexistent_site(self):
        """Тест: удаление несуществующего сайта возвращает ошибку"""
        result = cascade_delete_site_with_transaction(99999)
        
        self.assertFalse(result['success'])
        self.assertIn('не найден', result['error'])
    
    def test_cascade_delete_with_categories_having_posts(self):
        """Тест: удаление сайта с категориями, у которых есть посты"""
        # Создаем дополнительные посты в категориях
        Post.objects.create(
            title='Пост 3',
            slug='post-3',
            content='Содержание поста 3',
            site=self.site,
            author=self.author,
            category=self.category1,
            status='published'
        )
        
        # Выполняем каскадное удаление
        result = cascade_delete_site_with_transaction(self.site.id)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['posts_deleted'], 3)
        self.assertEqual(result['categories_deleted'], 2)
    
    def test_cascade_delete_with_many_to_many_relationships(self):
        """Тест: удаление сайта с many-to-many связями (посты-теги)"""
        # Проверяем, что у постов есть теги
        self.assertEqual(self.post1.tags.count(), 2)
        self.assertEqual(self.post2.tags.count(), 1)
        
        # Выполняем каскадное удаление
        result = cascade_delete_site_with_transaction(self.site.id)
        
        self.assertTrue(result['success'])
        # M2M связи должны быть автоматически очищены при удалении постов/тегов
    
    def test_cascade_delete_in_transaction_rollback(self):
        """Тест: откат транзакции при ошибке не изменяет данные"""
        site_id = self.site.id
        original_posts_count = Post.objects.filter(site=self.site).count()
        
        # Симулируем ошибку, переопределив метод delete
        original_delete = Site.delete
        
        def failing_delete(self, *args, **kwargs):
            raise Exception("Симуляция ошибки")
        
        Site.delete = failing_delete
        
        try:
            result = cascade_delete_site_with_transaction(site_id)
            
            # Проверяем, что операция неуспешна
            self.assertFalse(result['success'])
            
            # Проверяем, что данные не изменились (откат транзакции)
            self.assertTrue(Site.objects.filter(id=site_id).exists())
            self.assertEqual(Post.objects.filter(site=self.site).count(), original_posts_count)
            
        finally:
            # Восстанавливаем оригинальный метод
            Site.delete = original_delete
    
    def test_cascade_delete_with_empty_site(self):
        """Тест: удаление пустого сайта без контента"""
        # Создаем пустой сайт
        empty_site = Site.objects.create(
            name='Пустой сайт',
            domain='empty.example.com',
            owner=self.admin
        )
        
        result = cascade_delete_site_with_transaction(empty_site.id)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['posts_deleted'], 0)
        self.assertEqual(result['pages_deleted'], 0)
        self.assertEqual(result['categories_deleted'], 0)
        self.assertEqual(result['tags_deleted'], 0)
        self.assertEqual(result['dynamic_models_deleted'], 0)
        self.assertEqual(result['assigned_users_cleared'], 0)
    
    def test_normal_delete_vs_cascade_delete(self):
        """Тест: сравнение обычного удаления с каскадным"""
        # Создаем второй сайт для сравнения
        site2 = Site.objects.create(
            name='Второй сайт',
            domain='site2.example.com',
            owner=self.admin
        )
        
        # Создаем контент для второго сайта
        Post.objects.create(
            title='Пост на втором сайте',
            slug='post-site2',
            content='Содержание',
            site=site2,
            author=self.author,
            status='published'
        )
        
        site2_id = site2.id
        
        # Обычное удаление (должно работать благодаря CASCADE в моделях)
        site2.delete()
        
        # Проверяем, что связанные объекты удалены
        self.assertFalse(Site.objects.filter(id=site2_id).exists())
        self.assertEqual(Post.objects.filter(site_id=site2_id).count(), 0)
        
        # Каскадное удаление через функцию (с логированием)
        result = cascade_delete_site_with_transaction(self.site.id)
        self.assertTrue(result['success'])
        self.assertFalse(Site.objects.filter(id=self.site.id).exists()) 
# Generated by Django 5.0.6 on 2025-05-29 15:10

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('sites', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SettingCategory',
            fields=[
                ('id', models.CharField(max_length=50, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Название')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('icon', models.CharField(default='⚙️', max_length=10, verbose_name='Иконка')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активна')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
            ],
            options={
                'verbose_name': 'Категория настроек',
                'verbose_name_plural': 'Категории настроек',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='SettingGroup',
            fields=[
                ('id', models.CharField(max_length=50, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Название')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('icon', models.CharField(blank=True, max_length=10, verbose_name='Иконка')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активна')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='groups', to='settings.settingcategory', verbose_name='Категория')),
            ],
            options={
                'verbose_name': 'Группа настроек',
                'verbose_name_plural': 'Группы настроек',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='SettingTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Название')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('settings_data', models.JSONField(verbose_name='Данные настроек')),
                ('is_public', models.BooleanField(default=False, verbose_name='Публичный')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='setting_templates', to=settings.AUTH_USER_MODEL, verbose_name='Создал')),
            ],
            options={
                'verbose_name': 'Шаблон настроек',
                'verbose_name_plural': 'Шаблоны настроек',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Setting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=100, unique=True, verbose_name='Ключ')),
                ('label', models.CharField(max_length=255, verbose_name='Название')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('type', models.CharField(choices=[('text', 'Текст'), ('email', 'Email'), ('url', 'URL'), ('password', 'Пароль'), ('number', 'Число'), ('boolean', 'Переключатель'), ('select', 'Выпадающий список'), ('textarea', 'Многострочный текст'), ('color', 'Цвет'), ('file', 'Файл'), ('image', 'Изображение'), ('json', 'JSON'), ('rich_text', 'Форматированный текст')], max_length=20, verbose_name='Тип')),
                ('value', models.JSONField(blank=True, null=True, verbose_name='Значение')),
                ('default_value', models.JSONField(blank=True, null=True, verbose_name='Значение по умолчанию')),
                ('is_required', models.BooleanField(default=False, verbose_name='Обязательное')),
                ('is_readonly', models.BooleanField(default=False, verbose_name='Только для чтения')),
                ('validation_rules', models.JSONField(blank=True, help_text='JSON с правилами валидации', null=True, verbose_name='Правила валидации')),
                ('options', models.JSONField(blank=True, help_text='Опции для select типов', null=True, verbose_name='Опции')),
                ('placeholder', models.CharField(blank=True, max_length=255, verbose_name='Placeholder')),
                ('help_text', models.TextField(blank=True, verbose_name='Текст справки')),
                ('help_url', models.URLField(blank=True, verbose_name='Ссылка на справку')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('site', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='settings', to='sites.site', verbose_name='Сайт')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='Изменил')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='settings', to='settings.settinggroup', verbose_name='Группа')),
            ],
            options={
                'verbose_name': 'Настройка',
                'verbose_name_plural': 'Настройки',
                'ordering': ['group__order', 'order', 'label'],
                'indexes': [models.Index(fields=['key'], name='settings_se_key_4477c8_idx'), models.Index(fields=['group', 'order'], name='settings_se_group_i_ebd086_idx'), models.Index(fields=['site'], name='settings_se_site_id_505c40_idx')],
            },
        ),
    ]

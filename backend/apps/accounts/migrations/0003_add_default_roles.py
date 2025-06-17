from django.db import migrations

def create_default_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    
    # Создаем базовые роли, если они еще не существуют
    roles = [
        {
            'name': 'superuser',
            'permissions': {
                'can_manage_users': True,
                'can_manage_roles': True,
                'can_manage_sites': True,
                'can_manage_content': True,
                'can_view_analytics': True,
                'can_manage_settings': True
            }
        },
        {
            'name': 'admin',
            'permissions': {
                'can_manage_users': True,
                'can_manage_roles': False,
                'can_manage_sites': True,
                'can_manage_content': True,
                'can_view_analytics': True,
                'can_manage_settings': False
            }
        },
        {
            'name': 'author',
            'permissions': {
                'can_manage_users': False,
                'can_manage_roles': False,
                'can_manage_sites': False,
                'can_manage_content': True,
                'can_view_analytics': True,
                'can_manage_settings': False
            }
        },
        {
            'name': 'user',
            'permissions': {
                'can_manage_users': False,
                'can_manage_roles': False,
                'can_manage_sites': False,
                'can_manage_content': False,
                'can_view_analytics': False,
                'can_manage_settings': False
            }
        }
    ]
    
    for role_data in roles:
        Role.objects.get_or_create(
            name=role_data['name'],
            defaults={'permissions': role_data['permissions']}
        )

def remove_default_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(name__in=['superuser', 'admin', 'author', 'user']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_roles, remove_default_roles),
    ] 
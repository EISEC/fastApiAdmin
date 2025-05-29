from django.apps import AppConfig


class DynamicModelsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.dynamic_models"
    verbose_name = "Динамические модели"

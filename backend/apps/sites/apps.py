from django.apps import AppConfig


class SitesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sites"
    verbose_name = "Сайты"

    def ready(self):
        """Регистрируем сигналы при загрузке приложения"""
        try:
            from . import signals  # noqa: F401
        except ImportError:
            pass

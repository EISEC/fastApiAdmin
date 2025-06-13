from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings
from apps.sites.models import Site, SiteStorageSettings

class DynamicSiteS3Storage(S3Boto3Storage):
    """
    Кастомный storage для поддержки индивидуальных ключей/бакета для каждого сайта.
    Если у сайта есть свои настройки Object Storage — используются они,
    иначе fallback на глобальные настройки из settings.py
    """
    def __init__(self, site: Site = None, *args, **kwargs):
        if site and hasattr(site, 'storage_settings') and site.storage_settings:
            storage_settings = site.storage_settings
            kwargs['access_key'] = storage_settings.access_key
            kwargs['secret_key'] = storage_settings.secret_key
            kwargs['bucket_name'] = storage_settings.bucket_name
            kwargs['endpoint_url'] = storage_settings.endpoint
            kwargs['region_name'] = storage_settings.region
        else:
            kwargs['access_key'] = settings.AWS_ACCESS_KEY_ID
            kwargs['secret_key'] = settings.AWS_SECRET_ACCESS_KEY
            kwargs['bucket_name'] = settings.AWS_STORAGE_BUCKET_NAME
            kwargs['endpoint_url'] = settings.AWS_S3_ENDPOINT_URL
            kwargs['region_name'] = settings.AWS_S3_REGION_NAME
        super().__init__(*args, **kwargs) 
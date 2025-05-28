from pydantic import BaseModel, constr, HttpUrl
from typing import Optional, Dict, Any
from datetime import datetime

class SiteBase(BaseModel):
    name: constr(min_length=2, max_length=100)
    domain: constr(min_length=3, max_length=255)
    header_scripts: Optional[str] = None
    footer_scripts: Optional[str] = None
    main_screen_settings: Optional[Dict[str, Any]] = None
    seo_settings: Optional[Dict[str, Any]] = None
    icon: Optional[str] = None
    default_image: Optional[str] = None
    main_screen_image: Optional[str] = None
    error_403_image: Optional[str] = None
    error_404_image: Optional[str] = None
    error_4xx_image: Optional[str] = None
    error_5xx_image: Optional[str] = None

class SiteCreate(SiteBase):
    pass

class SiteUpdate(BaseModel):
    name: Optional[constr(min_length=2, max_length=100)] = None
    domain: Optional[constr(min_length=3, max_length=255)] = None
    header_scripts: Optional[str] = None
    footer_scripts: Optional[str] = None
    main_screen_settings: Optional[Dict[str, Any]] = None
    seo_settings: Optional[Dict[str, Any]] = None
    icon: Optional[str] = None
    default_image: Optional[str] = None
    main_screen_image: Optional[str] = None
    error_403_image: Optional[str] = None
    error_404_image: Optional[str] = None
    error_4xx_image: Optional[str] = None
    error_5xx_image: Optional[str] = None

class SiteInDB(SiteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Site(SiteInDB):
    pass 
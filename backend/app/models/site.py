from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base
from app.models.user import User
from app.models.page import Page
from app.models.post import Post
from app.models.dynamic_model import DynamicModel
from app.models.category import Category
from app.models.tag import Tag
from app.models.media import Media
from app.models.setting import Setting

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True, nullable=False)
    header_scripts = Column(Text, nullable=True)
    footer_scripts = Column(Text, nullable=True)
    main_screen_settings = Column(JSON, nullable=True)
    seo_settings = Column(JSON, nullable=True)
    icon = Column(String(255), nullable=True)
    default_image = Column(String(255), nullable=True)
    main_screen_image = Column(String(255), nullable=True)
    error_403_image = Column(String(255), nullable=True)
    error_404_image = Column(String(255), nullable=True)
    error_4xx_image = Column(String(255), nullable=True)
    error_5xx_image = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="site")
    pages = relationship("Page", back_populates="site")
    posts = relationship("Post", back_populates="site")
    dynamic_models = relationship("DynamicModel", back_populates="site")
    categories = relationship("Category", back_populates="site")
    tags = relationship("Tag", back_populates="site")
    media = relationship("Media", back_populates="site")
    settings = relationship("Setting", back_populates="site") 
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

# Определение таблицы для связи many-to-many между Page и Category
page_categories = Table(
    "page_categories",
    Base.metadata,
    Column("page_id", Integer, ForeignKey("pages.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True)
)

class Page(Base):
    __tablename__ = "pages"
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    slug = Column(String(255), unique=True, nullable=False)
    image = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    site = relationship("Site", back_populates="pages")
    categories = relationship("Category", secondary=page_categories, back_populates="pages")
    tags = relationship("Tag", secondary="page_tags", back_populates="pages") 
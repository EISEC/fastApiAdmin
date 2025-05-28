from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

# Определение таблицы для связи many-to-many между DynamicModel и Category
dynamic_model_categories = Table(
    "dynamic_model_categories",
    Base.metadata,
    Column("dynamic_model_id", Integer, ForeignKey("dynamic_models.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True)
)

class DynamicModel(Base):
    __tablename__ = "dynamic_models"
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    name = Column(String(100), nullable=False)
    fields_config = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    site = relationship("Site", back_populates="dynamic_models")
    items = relationship("DynamicModelItem", back_populates="model", cascade="all, delete-orphan")
    categories = relationship("Category", secondary=dynamic_model_categories, back_populates="dynamic_models")
    tags = relationship("Tag", secondary="dynamic_model_tags", back_populates="dynamic_models")

class DynamicModelItem(Base):
    __tablename__ = "dynamic_model_items"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("dynamic_models.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    model = relationship("DynamicModel", back_populates="items") 
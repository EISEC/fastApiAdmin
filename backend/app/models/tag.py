from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

# Association tables
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True)
)

page_tags = Table(
    "page_tags",
    Base.metadata,
    Column("page_id", Integer, ForeignKey("pages.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True)
)

dynamic_model_tags = Table(
    "dynamic_model_tags",
    Base.metadata,
    Column("dynamic_model_id", Integer, ForeignKey("dynamic_models.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True)
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    site = relationship("Site", back_populates="tags")
    posts = relationship("Post", secondary=post_tags, back_populates="tags")
    pages = relationship("Page", secondary=page_tags, back_populates="tags")
    dynamic_models = relationship("DynamicModel", secondary=dynamic_model_tags, back_populates="tags") 
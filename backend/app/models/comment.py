from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base_class import Base

class CommentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    status = Column(Enum(CommentStatus), default=CommentStatus.PENDING, nullable=False)
    
    # Полиморфные связи
    entity_type = Column(String(50), nullable=False)  # post, page, dynamic_model
    entity_id = Column(Integer, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    
    # Полиморфные отношения
    @property
    def entity(self):
        if self.entity_type == "post":
            return self.post
        elif self.entity_type == "page":
            return self.page
        elif self.entity_type == "dynamic_model":
            return self.dynamic_model
        return None 
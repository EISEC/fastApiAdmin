from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable для системных действий
    action_type = Column(String(50), nullable=False)  # create, update, delete, login, etc.
    entity_type = Column(String(50), nullable=False)  # user, post, page, etc.
    entity_id = Column(Integer, nullable=True)  # nullable для действий без конкретной сущности
    changes = Column(JSON, nullable=True)  # хранит изменения в формате JSON
    ip_address = Column(String(45), nullable=True)  # IPv4 или IPv6
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="activity_logs") 
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base
from app.models.user_contact import UserContact
from app.models.role import Role
from app.models.comment import Comment
from app.models.media import Media
from app.models.activity_log import ActivityLog

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    birth_date = Column(DateTime, nullable=True)
    about = Column(String(1000), nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Дополнительные поля для улучшений
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(32), nullable=True)
    last_login = Column(DateTime, nullable=True)
    login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    password_reset_token = Column(String(100), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(100), nullable=True)

    # Relationships
    contacts = relationship("UserContact", back_populates="user", cascade="all, delete-orphan")
    site = relationship("Site", back_populates="users")
    role = relationship("app.models.role.Role", back_populates="users")
    comments = relationship("Comment", back_populates="user")
    media = relationship("Media", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user") 
from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: EmailStr
    birth_date: Optional[datetime] = None
    about: Optional[str] = None
    site_id: Optional[int] = None
    role_id: int
    is_active: bool = True
    rating: float = 0.0

class UserCreate(UserBase):
    password: constr(min_length=8)

class UserUpdate(BaseModel):
    username: Optional[constr(min_length=3, max_length=50)] = None
    email: Optional[EmailStr] = None
    birth_date: Optional[datetime] = None
    about: Optional[str] = None
    site_id: Optional[int] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    rating: Optional[float] = None

class UserInDB(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class User(UserInDB):
    pass 
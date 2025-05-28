from pydantic import BaseModel, constr
from typing import Optional
from datetime import datetime
from app.models.user_contact import ContactType

class UserContactBase(BaseModel):
    contact_type: ContactType
    value: constr(min_length=3, max_length=255)
    is_verified: bool = False

class UserContactCreate(UserContactBase):
    user_id: int

class UserContactUpdate(BaseModel):
    contact_type: Optional[ContactType] = None
    value: Optional[constr(min_length=3, max_length=255)] = None
    is_verified: Optional[bool] = None

class UserContactInDB(UserContactBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserContact(UserContactInDB):
    pass 
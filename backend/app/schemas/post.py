from pydantic import BaseModel, constr
from typing import Optional
from datetime import datetime

class PostBase(BaseModel):
    site_id: int
    title: constr(min_length=2, max_length=255)
    content: Optional[str] = None
    slug: constr(min_length=2, max_length=255)
    image: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[constr(min_length=2, max_length=255)] = None
    content: Optional[str] = None
    slug: Optional[constr(min_length=2, max_length=255)] = None
    image: Optional[str] = None

class PostInDB(PostBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Post(PostInDB):
    pass 
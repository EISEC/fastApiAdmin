from pydantic import BaseModel, constr
from typing import Optional
from datetime import datetime

class RoleBase(BaseModel):
    name: constr(min_length=2, max_length=50)
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[constr(min_length=2, max_length=50)] = None
    description: Optional[str] = None

class RoleInDB(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Role(RoleInDB):
    pass 
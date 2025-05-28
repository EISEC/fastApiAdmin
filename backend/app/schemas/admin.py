from pydantic import BaseModel, EmailStr

class AdminBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True
    is_superuser: bool = False

class AdminCreate(AdminBase):
    password: str

class AdminUpdate(AdminBase):
    password: str | None = None

class AdminInDBBase(AdminBase):
    id: int

    class Config:
        from_attributes = True

class Admin(AdminInDBBase):
    pass

class AdminInDB(AdminInDBBase):
    hashed_password: str 
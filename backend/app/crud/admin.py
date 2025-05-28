from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.models.admin import Admin
from app.schemas.admin import AdminCreate, AdminUpdate

def get_by_email(db: Session, email: str) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.email == email).first()

def get_by_username(db: Session, username: str) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.username == username).first()

def get(db: Session, id: int) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.id == id).first()

def create(db: Session, *, obj_in: AdminCreate) -> Admin:
    db_obj = Admin(
        email=obj_in.email,
        username=obj_in.username,
        hashed_password=get_password_hash(obj_in.password),
        is_active=obj_in.is_active,
        is_superuser=obj_in.is_superuser,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(
    db: Session, *, db_obj: Admin, obj_in: Union[AdminUpdate, Dict[str, Any]]
) -> Admin:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    if update_data.get("password"):
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def authenticate(db: Session, *, username: str, password: str) -> Optional[Admin]:
    admin = get_by_username(db, username=username)
    if not admin:
        return None
    if not verify_password(password, admin.hashed_password):
        return None
    return admin 
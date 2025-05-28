from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    admin = crud.admin.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    if not admin:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not admin.is_active:
        raise HTTPException(status_code=400, detail="Inactive admin")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            admin.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/create", response_model=schemas.Admin)
def create_admin(
    *,
    db: Session = Depends(deps.get_db),
    admin_in: schemas.AdminCreate,
    current_admin: models.Admin = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new admin.
    """
    admin = crud.admin.get_by_email(db, email=admin_in.email)
    if admin:
        raise HTTPException(
            status_code=400,
            detail="The admin with this email already exists in the system.",
        )
    admin = crud.admin.create(db, obj_in=admin_in)
    return admin

@router.get("/me", response_model=schemas.Admin)
def read_admin_me(
    current_admin: models.Admin = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get current admin.
    """
    return current_admin

@router.put("/me", response_model=schemas.Admin)
def update_admin_me(
    *,
    db: Session = Depends(deps.get_db),
    admin_in: schemas.AdminUpdate,
    current_admin: models.Admin = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update own admin.
    """
    admin = crud.admin.update(db, db_obj=current_admin, obj_in=admin_in)
    return admin 
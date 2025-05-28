import logging
from sqlalchemy.orm import Session
from app import crud, schemas
from app.core.config import settings
from app.db import base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    # Create first superuser
    user = crud.user.get_by_email(db, email=settings.FIRST_SUPERUSER)
    if not user:
        user_in = schemas.UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_active=True,
            is_superuser=True,
        )
        user = crud.user.create(db, obj_in=user_in)
        logger.info("Created first superuser")

    # Create first role
    role = crud.role.get_by_name(db, name="admin")
    if not role:
        role_in = schemas.RoleCreate(
            name="admin",
            description="Administrator role",
        )
        role = crud.role.create(db, obj_in=role_in)
        logger.info("Created first role") 
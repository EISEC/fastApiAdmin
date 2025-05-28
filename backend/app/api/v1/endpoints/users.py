from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.core.security import get_password_hash

router = APIRouter()

@router.get(
    "/",
    response_model=List[schemas.User],
    summary="Получить список пользователей",
    description="Возвращает список всех пользователей. Требуется авторизация."
)
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить список пользователей.
    """
    users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post(
    "/",
    response_model=schemas.User,
    summary="Создать нового пользователя",
    description="Создаёт нового пользователя. Требуется авторизация."
)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создать нового пользователя.
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует.",
        )
    user = crud.user.create(db, obj_in=user_in)
    return user

@router.put(
    "/me",
    response_model=schemas.User,
    summary="Обновить свой профиль",
    description="Обновляет данные текущего пользователя. Требуется авторизация."
)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    password: str = Body(None),
    email: str = Body(None),
    username: str = Body(None),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Обновить свой профиль.
    """
    current_user_data = jsonable_encoder(current_user)
    user_in = schemas.UserUpdate(**current_user_data)
    if password is not None:
        user_in.password = password
    if email is not None:
        user_in.email = email
    if username is not None:
        user_in.username = username
    user = crud.user.update(db, db_obj=current_user, obj_in=user_in)
    return user

@router.get(
    "/me",
    response_model=schemas.User,
    summary="Получить свой профиль",
    description="Возвращает данные текущего пользователя. Требуется авторизация."
)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить свой профиль.
    """
    return current_user

@router.get(
    "/{user_id}",
    response_model=schemas.User,
    summary="Получить пользователя по ID",
    description="Возвращает пользователя по его идентификатору. Требуется авторизация."
)
def read_user_by_id(
    user_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Получить пользователя по ID.
    """
    user = crud.user.get(db, id=user_id)
    if user == current_user:
        return user
    if not crud.user.is_active(current_user):
        raise HTTPException(status_code=400, detail="Пользователь неактивен")
    return user

@router.put(
    "/{user_id}",
    response_model=schemas.User,
    summary="Обновить пользователя по ID",
    description="Обновляет данные пользователя по его идентификатору. Требуется авторизация."
)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Обновить пользователя по ID.
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Пользователь с таким именем не найден.",
        )
    user = crud.user.update(db, db_obj=user, obj_in=user_in)
    return user 
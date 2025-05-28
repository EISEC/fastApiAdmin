from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.utils import (
    generate_password_reset_token,
    verify_password_reset_token,
)

router = APIRouter()

@router.post(
    "/login/access-token",
    response_model=schemas.Token,
    summary="Получить токен доступа",
    description="OAuth2 совместимый вход, получает токен доступа для будущих запросов."
)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 совместимый вход, получает токен доступа для будущих запросов.
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Неверный email или пароль")
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Пользователь неактивен")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post(
    "/login/test-token",
    response_model=schemas.User,
    summary="Проверить токен доступа",
    description="Проверяет токен доступа."
)
def test_token(current_user: models.User = Depends(deps.get_current_user)) -> Any:
    """
    Проверить токен доступа.
    """
    return current_user

@router.post(
    "/password-recovery/{email}",
    response_model=schemas.Msg,
    summary="Восстановление пароля",
    description="Отправляет email для восстановления пароля."
)
def recover_password(email: str, db: Session = Depends(deps.get_db)) -> Any:
    """
    Восстановление пароля.
    """
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Пользователь с таким email не найден.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    # TODO: Отправить email с токеном для сброса пароля
    return {"msg": "Email для восстановления пароля отправлен"}

@router.post(
    "/reset-password/",
    response_model=schemas.Msg,
    summary="Сброс пароля",
    description="Сбрасывает пароль пользователя."
)
def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Сброс пароля.
    """
    email = verify_password_reset_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Неверный токен")
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Пользователь с таким email не найден.",
        )
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Пользователь неактивен")
    hashed_password = get_password_hash(new_password)
    user.password_hash = hashed_password
    db.add(user)
    db.commit()
    return {"msg": "Пароль успешно обновлен"} 
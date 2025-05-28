from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get(
    "/",
    response_model=List[schemas.Role],
    summary="Получить список ролей",
    description="Возвращает список всех ролей. Требуется авторизация."
)
def read_roles(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить список ролей.
    """
    roles = crud.role.get_multi(db, skip=skip, limit=limit)
    return roles

@router.post(
    "/",
    response_model=schemas.Role,
    summary="Создать новую роль",
    description="Создаёт новую роль. Требуется авторизация."
)
def create_role(
    *,
    db: Session = Depends(deps.get_db),
    role_in: schemas.RoleCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создать новую роль.
    """
    role = crud.role.get_by_name(db, name=role_in.name)
    if role:
        raise HTTPException(
            status_code=400,
            detail="Роль с таким именем уже существует.",
        )
    role = crud.role.create(db, obj_in=role_in)
    return role

@router.get(
    "/{role_id}",
    response_model=schemas.Role,
    summary="Получить роль по ID",
    description="Возвращает роль по её идентификатору. Требуется авторизация."
)
def read_role(
    *,
    db: Session = Depends(deps.get_db),
    role_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить роль по ID.
    """
    role = crud.role.get(db, id=role_id)
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Роль не найдена",
        )
    return role

@router.put(
    "/{role_id}",
    response_model=schemas.Role,
    summary="Обновить роль",
    description="Обновляет существующую роль по ID. Требуется авторизация."
)
def update_role(
    *,
    db: Session = Depends(deps.get_db),
    role_id: int,
    role_in: schemas.RoleUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Обновить роль.
    """
    role = crud.role.get(db, id=role_id)
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Роль не найдена",
        )
    role = crud.role.update(db, db_obj=role, obj_in=role_in)
    return role

@router.delete(
    "/{role_id}",
    response_model=schemas.Role,
    summary="Удалить роль",
    description="Удаляет роль по ID. Требуется авторизация."
)
def delete_role(
    *,
    db: Session = Depends(deps.get_db),
    role_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Удалить роль.
    """
    role = crud.role.get(db, id=role_id)
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Роль не найдена",
        )
    role = crud.role.remove(db, id=role_id)
    return role 
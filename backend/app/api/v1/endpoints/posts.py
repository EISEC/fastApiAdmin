from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get(
    "/",
    response_model=List[schemas.Post],
    summary="Получить список постов",
    description="Возвращает список всех постов. Требуется авторизация."
)
def read_posts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить список постов.
    """
    posts = crud.post.get_multi(db, skip=skip, limit=limit)
    return posts

@router.post(
    "/",
    response_model=schemas.Post,
    summary="Создать новый пост",
    description="Создаёт новый пост. Требуется авторизация."
)
def create_post(
    *,
    db: Session = Depends(deps.get_db),
    post_in: schemas.PostCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создать новый пост.
    """
    post = crud.post.get_by_slug(db, slug=post_in.slug)
    if post:
        raise HTTPException(
            status_code=400,
            detail="Пост с таким slug уже существует.",
        )
    post = crud.post.create(db, obj_in=post_in)
    return post

@router.get(
    "/{post_id}",
    response_model=schemas.Post,
    summary="Получить пост по ID",
    description="Возвращает пост по его идентификатору. Требуется авторизация."
)
def read_post(
    *,
    db: Session = Depends(deps.get_db),
    post_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить пост по ID.
    """
    post = crud.post.get(db, id=post_id)
    if not post:
        raise HTTPException(
            status_code=404,
            detail="Пост не найден",
        )
    return post

@router.put(
    "/{post_id}",
    response_model=schemas.Post,
    summary="Обновить пост",
    description="Обновляет существующий пост по ID. Требуется авторизация."
)
def update_post(
    *,
    db: Session = Depends(deps.get_db),
    post_id: int,
    post_in: schemas.PostUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Обновить пост.
    """
    post = crud.post.get(db, id=post_id)
    if not post:
        raise HTTPException(
            status_code=404,
            detail="Пост не найден",
        )
    post = crud.post.update(db, db_obj=post, obj_in=post_in)
    return post

@router.delete(
    "/{post_id}",
    response_model=schemas.Post,
    summary="Удалить пост",
    description="Удаляет пост по ID. Требуется авторизация."
)
def delete_post(
    *,
    db: Session = Depends(deps.get_db),
    post_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Удалить пост.
    """
    post = crud.post.get(db, id=post_id)
    if not post:
        raise HTTPException(
            status_code=404,
            detail="Пост не найден",
        )
    post = crud.post.remove(db, id=post_id)
    return post 
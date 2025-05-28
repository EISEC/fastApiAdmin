from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get(
    "/",
    response_model=List[schemas.Page],
    summary="Получить список страниц",
    description="Возвращает список всех страниц. Требуется авторизация."
)
def read_pages(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить список страниц.
    """
    pages = crud.page.get_multi(db, skip=skip, limit=limit)
    return pages

@router.post(
    "/",
    response_model=schemas.Page,
    summary="Создать новую страницу",
    description="Создаёт новую страницу. Требуется авторизация."
)
def create_page(
    *,
    db: Session = Depends(deps.get_db),
    page_in: schemas.PageCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создать новую страницу.
    """
    page = crud.page.get_by_slug(db, slug=page_in.slug)
    if page:
        raise HTTPException(
            status_code=400,
            detail="Страница с таким slug уже существует.",
        )
    page = crud.page.create(db, obj_in=page_in)
    return page

@router.get(
    "/{page_id}",
    response_model=schemas.Page,
    summary="Получить страницу по ID",
    description="Возвращает страницу по её идентификатору. Требуется авторизация."
)
def read_page(
    *,
    db: Session = Depends(deps.get_db),
    page_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить страницу по ID.
    """
    page = crud.page.get(db, id=page_id)
    if not page:
        raise HTTPException(
            status_code=404,
            detail="Страница не найдена",
        )
    return page

@router.put(
    "/{page_id}",
    response_model=schemas.Page,
    summary="Обновить страницу",
    description="Обновляет существующую страницу по ID. Требуется авторизация."
)
def update_page(
    *,
    db: Session = Depends(deps.get_db),
    page_id: int,
    page_in: schemas.PageUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Обновить страницу.
    """
    page = crud.page.get(db, id=page_id)
    if not page:
        raise HTTPException(
            status_code=404,
            detail="Страница не найдена",
        )
    page = crud.page.update(db, db_obj=page, obj_in=page_in)
    return page

@router.delete(
    "/{page_id}",
    response_model=schemas.Page,
    summary="Удалить страницу",
    description="Удаляет страницу по ID. Требуется авторизация."
)
def delete_page(
    *,
    db: Session = Depends(deps.get_db),
    page_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Удалить страницу.
    """
    page = crud.page.get(db, id=page_id)
    if not page:
        raise HTTPException(
            status_code=404,
            detail="Страница не найдена",
        )
    page = crud.page.remove(db, id=page_id)
    return page 
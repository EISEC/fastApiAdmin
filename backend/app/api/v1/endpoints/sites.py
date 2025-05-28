from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get(
    "/",
    response_model=List[schemas.Site],
    summary="Получить список сайтов",
    description="Возвращает список всех сайтов. Требуется авторизация."
)
def read_sites(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить список сайтов.
    """
    sites = crud.site.get_multi(db, skip=skip, limit=limit)
    return sites

@router.post(
    "/",
    response_model=schemas.Site,
    summary="Создать новый сайт",
    description="Создаёт новый сайт. Требуется авторизация."
)
def create_site(
    *,
    db: Session = Depends(deps.get_db),
    site_in: schemas.SiteCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создать новый сайт.
    """
    site = crud.site.get_by_domain(db, domain=site_in.domain)
    if site:
        raise HTTPException(
            status_code=400,
            detail="Сайт с таким доменом уже существует.",
        )
    site = crud.site.create(db, obj_in=site_in)
    return site

@router.get(
    "/{site_id}",
    response_model=schemas.Site,
    summary="Получить сайт по ID",
    description="Возвращает сайт по его идентификатору. Требуется авторизация."
)
def read_site(
    *,
    db: Session = Depends(deps.get_db),
    site_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить сайт по ID.
    """
    site = crud.site.get(db, id=site_id)
    if not site:
        raise HTTPException(
            status_code=404,
            detail="Сайт не найден",
        )
    return site

@router.put(
    "/{site_id}",
    response_model=schemas.Site,
    summary="Обновить сайт",
    description="Обновляет существующий сайт по ID. Требуется авторизация."
)
def update_site(
    *,
    db: Session = Depends(deps.get_db),
    site_id: int,
    site_in: schemas.SiteUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Обновить сайт.
    """
    site = crud.site.get(db, id=site_id)
    if not site:
        raise HTTPException(
            status_code=404,
            detail="Сайт не найден",
        )
    site = crud.site.update(db, db_obj=site, obj_in=site_in)
    return site

@router.delete(
    "/{site_id}",
    response_model=schemas.Site,
    summary="Удалить сайт",
    description="Удаляет сайт по ID. Требуется авторизация."
)
def delete_site(
    *,
    db: Session = Depends(deps.get_db),
    site_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Удалить сайт.
    """
    site = crud.site.get(db, id=site_id)
    if not site:
        raise HTTPException(
            status_code=404,
            detail="Сайт не найден",
        )
    site = crud.site.remove(db, id=site_id)
    return site 
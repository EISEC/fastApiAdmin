from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get(
    "/",
    response_model=List[schemas.DynamicModel],
    summary="Получить список динамических моделей",
    description="Возвращает список всех динамических моделей. Требуется авторизация."
)
def read_dynamic_models(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить список динамических моделей.
    """
    dynamic_models = crud.dynamic_model.get_multi(db, skip=skip, limit=limit)
    return dynamic_models

@router.post(
    "/",
    response_model=schemas.DynamicModel,
    summary="Создать новую динамическую модель",
    description="Создаёт новую динамическую модель. Требуется авторизация."
)
def create_dynamic_model(
    *,
    db: Session = Depends(deps.get_db),
    dynamic_model_in: schemas.DynamicModelCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создать новую динамическую модель.
    """
    dynamic_model = crud.dynamic_model.get_by_name(db, name=dynamic_model_in.name)
    if dynamic_model:
        raise HTTPException(
            status_code=400,
            detail="Динамическая модель с таким именем уже существует.",
        )
    dynamic_model = crud.dynamic_model.create(db, obj_in=dynamic_model_in)
    return dynamic_model

@router.get(
    "/{model_id}",
    response_model=schemas.DynamicModel,
    summary="Получить динамическую модель по ID",
    description="Возвращает динамическую модель по её идентификатору. Требуется авторизация."
)
def read_dynamic_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить динамическую модель по ID.
    """
    dynamic_model = crud.dynamic_model.get(db, id=model_id)
    if not dynamic_model:
        raise HTTPException(
            status_code=404,
            detail="Динамическая модель не найдена",
        )
    return dynamic_model

@router.put(
    "/{model_id}",
    response_model=schemas.DynamicModel,
    summary="Обновить динамическую модель",
    description="Обновляет существующую динамическую модель по ID. Требуется авторизация."
)
def update_dynamic_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    dynamic_model_in: schemas.DynamicModelUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Обновить динамическую модель.
    """
    dynamic_model = crud.dynamic_model.get(db, id=model_id)
    if not dynamic_model:
        raise HTTPException(
            status_code=404,
            detail="Динамическая модель не найдена",
        )
    dynamic_model = crud.dynamic_model.update(db, db_obj=dynamic_model, obj_in=dynamic_model_in)
    return dynamic_model

@router.delete(
    "/{model_id}",
    response_model=schemas.DynamicModel,
    summary="Удалить динамическую модель",
    description="Удаляет динамическую модель по ID. Требуется авторизация."
)
def delete_dynamic_model(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Удалить динамическую модель.
    """
    dynamic_model = crud.dynamic_model.get(db, id=model_id)
    if not dynamic_model:
        raise HTTPException(
            status_code=404,
            detail="Динамическая модель не найдена",
        )
    dynamic_model = crud.dynamic_model.remove(db, id=model_id)
    return dynamic_model

@router.get(
    "/{model_id}/items",
    response_model=List[schemas.DynamicModelItem],
    summary="Получить список элементов динамической модели",
    description="Возвращает список всех элементов динамической модели. Требуется авторизация."
)
def read_dynamic_model_items(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить список элементов динамической модели.
    """
    items = crud.dynamic_model_item.get_multi_by_model(
        db, model_id=model_id, skip=skip, limit=limit
    )
    return items

@router.post(
    "/{model_id}/items",
    response_model=schemas.DynamicModelItem,
    summary="Создать новый элемент динамической модели",
    description="Создаёт новый элемент динамической модели. Требуется авторизация."
)
def create_dynamic_model_item(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    item_in: schemas.DynamicModelItemCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Создать новый элемент динамической модели.
    """
    dynamic_model = crud.dynamic_model.get(db, id=model_id)
    if not dynamic_model:
        raise HTTPException(
            status_code=404,
            detail="Динамическая модель не найдена",
        )
    item = crud.dynamic_model_item.create_with_model(
        db, obj_in=item_in, model_id=model_id
    )
    return item

@router.get(
    "/{model_id}/items/{item_id}",
    response_model=schemas.DynamicModelItem,
    summary="Получить элемент динамической модели по ID",
    description="Возвращает элемент динамической модели по его идентификатору. Требуется авторизация."
)
def read_dynamic_model_item(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    item_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Получить элемент динамической модели по ID.
    """
    item = crud.dynamic_model_item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Элемент динамической модели не найден",
        )
    return item

@router.put(
    "/{model_id}/items/{item_id}",
    response_model=schemas.DynamicModelItem,
    summary="Обновить элемент динамической модели",
    description="Обновляет существующий элемент динамической модели по ID. Требуется авторизация."
)
def update_dynamic_model_item(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    item_id: int,
    item_in: schemas.DynamicModelItemUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Обновить элемент динамической модели.
    """
    item = crud.dynamic_model_item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Элемент динамической модели не найден",
        )
    item = crud.dynamic_model_item.update(db, db_obj=item, obj_in=item_in)
    return item

@router.delete(
    "/{model_id}/items/{item_id}",
    response_model=schemas.DynamicModelItem,
    summary="Удалить элемент динамической модели",
    description="Удаляет элемент динамической модели по ID. Требуется авторизация."
)
def delete_dynamic_model_item(
    *,
    db: Session = Depends(deps.get_db),
    model_id: int,
    item_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Удалить элемент динамической модели.
    """
    item = crud.dynamic_model_item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Элемент динамической модели не найден",
        )
    item = crud.dynamic_model_item.remove(db, id=item_id)
    return item 
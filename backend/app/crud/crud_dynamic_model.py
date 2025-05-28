from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.dynamic_model import DynamicModel, DynamicModelItem
from app.schemas.dynamic_model import (
    DynamicModelCreate,
    DynamicModelUpdate,
    DynamicModelItemCreate,
    DynamicModelItemUpdate,
)

class CRUDDynamicModel(CRUDBase[DynamicModel, DynamicModelCreate, DynamicModelUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[DynamicModel]:
        return db.query(DynamicModel).filter(DynamicModel.name == name).first()

    def get_multi_by_site(
        self, db: Session, *, site_id: int, skip: int = 0, limit: int = 100
    ) -> List[DynamicModel]:
        return (
            db.query(self.model)
            .filter(DynamicModel.site_id == site_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

class CRUDDynamicModelItem(CRUDBase[DynamicModelItem, DynamicModelItemCreate, DynamicModelItemUpdate]):
    def get_multi_by_model(
        self, db: Session, *, model_id: int, skip: int = 0, limit: int = 100
    ) -> List[DynamicModelItem]:
        return (
            db.query(self.model)
            .filter(DynamicModelItem.model_id == model_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_model(
        self, db: Session, *, obj_in: DynamicModelItemCreate, model_id: int
    ) -> DynamicModelItem:
        obj_in_data = obj_in.dict()
        db_obj = DynamicModelItem(**obj_in_data, model_id=model_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

dynamic_model = CRUDDynamicModel(DynamicModel)
dynamic_model_item = CRUDDynamicModelItem(DynamicModelItem) 
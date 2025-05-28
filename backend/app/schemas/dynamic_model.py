from pydantic import BaseModel, constr
from typing import Optional, Dict, Any, List
from datetime import datetime

class DynamicModelBase(BaseModel):
    site_id: int
    name: constr(min_length=2, max_length=100)
    fields_config: Dict[str, Any]

class DynamicModelCreate(DynamicModelBase):
    pass

class DynamicModelUpdate(BaseModel):
    name: Optional[constr(min_length=2, max_length=100)] = None
    fields_config: Optional[Dict[str, Any]] = None

class DynamicModelInDB(DynamicModelBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DynamicModel(DynamicModelInDB):
    pass

class DynamicModelItemBase(BaseModel):
    model_id: int
    data: Dict[str, Any]

class DynamicModelItemCreate(DynamicModelItemBase):
    pass

class DynamicModelItemUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None

class DynamicModelItemInDB(DynamicModelItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DynamicModelItem(DynamicModelItemInDB):
    pass 
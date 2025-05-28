from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate

class CRUDRole(CRUDBase[Role, RoleCreate, RoleUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Role]:
        return db.query(Role).filter(Role.name == name).first()

    def get_multi_by_site(
        self, db: Session, *, site_id: int, skip: int = 0, limit: int = 100
    ) -> List[Role]:
        return (
            db.query(self.model)
            .filter(Role.site_id == site_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

role = CRUDRole(Role) 
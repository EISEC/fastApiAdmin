from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteUpdate

class CRUDSite(CRUDBase[Site, SiteCreate, SiteUpdate]):
    def get_by_domain(self, db: Session, *, domain: str) -> Optional[Site]:
        return db.query(Site).filter(Site.domain == domain).first()

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Site]:
        return (
            db.query(self.model)
            .filter(Site.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

site = CRUDSite(Site) 
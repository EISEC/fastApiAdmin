from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.page import Page
from app.schemas.page import PageCreate, PageUpdate

class CRUDPage(CRUDBase[Page, PageCreate, PageUpdate]):
    def get_by_slug(self, db: Session, *, slug: str) -> Optional[Page]:
        return db.query(Page).filter(Page.slug == slug).first()

    def get_multi_by_site(
        self, db: Session, *, site_id: int, skip: int = 0, limit: int = 100
    ) -> List[Page]:
        return (
            db.query(self.model)
            .filter(Page.site_id == site_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

page = CRUDPage(Page) 
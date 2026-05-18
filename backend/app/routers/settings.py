from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=schemas.SiteSettingsRead)
def read_settings(db: Session = Depends(get_db)):
    return crud.get_site_settings(db)

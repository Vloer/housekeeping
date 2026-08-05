import sqlite3
from fastapi import APIRouter, Depends
from core.database import get_db
from repositories.highscore_repository import HighscoreRepository
from repositories.household_repository import HouseholdRepository
from services.highscore_service import HighscoreService
from schemas.highscore import HighscoreEntryResponse, UserTaskStatResponse

router = APIRouter(prefix="/api/highscores", tags=["Highscores"])

def get_highscore_service(db: sqlite3.Connection = Depends(get_db)) -> HighscoreService:
    repo = HighscoreRepository(db)
    household_repo = HouseholdRepository(db)
    return HighscoreService(repo, household_repo)

@router.get("/household/{household_id}", response_model=list[HighscoreEntryResponse])
def get_household_highscores(household_id: int, service: HighscoreService = Depends(get_highscore_service)):
    return service.get_household_highscores(household_id)

@router.get("/global", response_model=list[HighscoreEntryResponse])
def get_global_highscores(service: HighscoreService = Depends(get_highscore_service)):
    return service.get_global_highscores()

@router.get("/household/{household_id}/user/{user_uuid}/tasks", response_model=list[UserTaskStatResponse])
def get_user_task_stats(household_id: int, user_uuid: str, service: HighscoreService = Depends(get_highscore_service)):
    return service.get_user_task_stats(household_id, user_uuid)

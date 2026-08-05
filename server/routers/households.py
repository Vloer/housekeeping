import sqlite3
from fastapi import APIRouter, Depends
from core.database import get_db
from repositories.household_repository import HouseholdRepository
from services.household_service import HouseholdService
from schemas.household import (
    HouseholdCreate,
    HouseholdJoin,
    HouseholdResponse,
    CheckJoinResponse,
    HouseholdInfoResponse
)

router = APIRouter(prefix="/api/households", tags=["Households"])

def get_household_service(db: sqlite3.Connection = Depends(get_db)) -> HouseholdService:
    repo = HouseholdRepository(db)
    return HouseholdService(repo)

@router.post("/check-join", response_model=CheckJoinResponse)
def check_join(req: HouseholdJoin, service: HouseholdService = Depends(get_household_service)):
    return service.check_join(req)

@router.post("/create", response_model=HouseholdResponse)
def create_household(req: HouseholdCreate, service: HouseholdService = Depends(get_household_service)):
    return service.create(req)

@router.post("/join", response_model=HouseholdResponse)
def join_household(req: HouseholdJoin, service: HouseholdService = Depends(get_household_service)):
    return service.join(req)

@router.get("/{household_id}/info", response_model=HouseholdInfoResponse)
def get_household_info(household_id: int, service: HouseholdService = Depends(get_household_service)):
    return service.get_info(household_id)

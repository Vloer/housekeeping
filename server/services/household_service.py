import random
import string
from fastapi import HTTPException, status
from repositories.household_repository import HouseholdRepository
from schemas.household import (
    HouseholdCreate,
    HouseholdJoin,
    HouseholdResponse,
    CheckJoinResponse,
    HouseholdInfoResponse
)
from core.config import PREINSTALLED_TASKS

class HouseholdService:
    def __init__(self, repo: HouseholdRepository):
        self.repo = repo

    def generate_join_code(self) -> str:
        chars = string.ascii_uppercase + string.digits
        rand_str = "".join(random.choices(chars, k=4))
        return f"HK-{rand_str}"

    def check_join(self, req: HouseholdJoin) -> CheckJoinResponse:
        code = req.join_code.strip().upper()
        row = self.repo.get_by_join_code(code)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid join code. Household not found."
            )
        
        household_id = row["id"]
        user_uuid = req.user_uuid.strip() if req.user_uuid else ""
        
        existing_username = None
        is_member = False
        if user_uuid:
            member_row = self.repo.get_member_by_uuid(household_id, user_uuid)
            if member_row:
                existing_username = member_row["username"]
                is_member = True
                
        return CheckJoinResponse(
            household_id=household_id,
            name=row["name"],
            join_code=row["join_code"],
            is_member=is_member,
            existing_username=existing_username
        )

    def create(self, req: HouseholdCreate) -> HouseholdResponse:
        join_code = self.generate_join_code()
        while self.repo.exists_join_code(join_code):
            join_code = self.generate_join_code()
        
        household_id = self.repo.create_household(req.name, join_code)
        self.repo.add_preinstalled_tasks(household_id, PREINSTALLED_TASKS)
        
        username = req.user_name.strip() if req.user_name else "User"
        user_uuid = req.user_uuid.strip() if req.user_uuid else ""
        
        if user_uuid:
            if self.repo.is_username_taken(household_id, username):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"The username '{username}' is already taken in this household. Please choose a different name."
                )
            self.repo.add_member(household_id, user_uuid, username)
        
        self.repo.commit()
        return HouseholdResponse(
            household_id=household_id,
            name=req.name,
            join_code=join_code,
            username=username
        )

    def join(self, req: HouseholdJoin) -> HouseholdResponse:
        code = req.join_code.strip().upper()
        row = self.repo.get_by_join_code(code)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid join code. Household not found."
            )
        
        household_id = row["id"]
        user_uuid = req.user_uuid.strip() if req.user_uuid else ""
        username = req.user_name.strip() if req.user_name else ""
        
        if user_uuid:
            member_row = self.repo.get_member_by_uuid(household_id, user_uuid)
            if member_row:
                username = member_row["username"]
            else:
                if not username:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Please enter your name for this household."
                    )
                if self.repo.is_username_taken(household_id, username):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"The username '{username}' is already taken in this household. Please choose a different name."
                    )
                self.repo.add_member(household_id, user_uuid, username)
                self.repo.commit()
                
        return HouseholdResponse(
            household_id=household_id,
            name=row["name"],
            join_code=row["join_code"],
            username=username
        )

    def get_info(self, household_id: int) -> HouseholdInfoResponse:
        row = self.repo.get_by_id(household_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Household not found"
            )
        return HouseholdInfoResponse(
            household_id=row["id"],
            name=row["name"],
            join_code=row["join_code"]
        )

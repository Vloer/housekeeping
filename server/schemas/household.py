from pydantic import BaseModel

class HouseholdCreate(BaseModel):
    name: str
    user_name: str | None = None
    user_uuid: str | None = None

class HouseholdJoin(BaseModel):
    join_code: str
    user_name: str | None = None
    user_uuid: str | None = None

class HouseholdResponse(BaseModel):
    household_id: int
    name: str
    join_code: str
    username: str | None = None

class CheckJoinResponse(BaseModel):
    household_id: int
    name: str
    join_code: str
    is_member: bool
    existing_username: str | None = None

class HouseholdInfoResponse(BaseModel):
    household_id: int
    name: str
    join_code: str

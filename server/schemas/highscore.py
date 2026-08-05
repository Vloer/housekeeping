from pydantic import BaseModel

class HighscoreEntryResponse(BaseModel):
    rank: int
    user_uuid: str
    username: str
    points: int

class UserTaskStatResponse(BaseModel):
    task_name: str
    completions_count: int
    total_points: int

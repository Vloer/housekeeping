from fastapi import HTTPException, status
from repositories.highscore_repository import HighscoreRepository
from repositories.household_repository import HouseholdRepository
from schemas.highscore import HighscoreEntryResponse, UserTaskStatResponse

class HighscoreService:
    def __init__(self, repo: HighscoreRepository, household_repo: HouseholdRepository):
        self.repo = repo
        self.household_repo = household_repo

    def get_household_highscores(self, household_id: int) -> list[HighscoreEntryResponse]:
        if not self.household_repo.get_by_id(household_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

        rows = self.repo.get_household_highscores(household_id)
        result = []
        for idx, r in enumerate(rows, start=1):
            result.append(HighscoreEntryResponse(
                rank=idx,
                user_uuid=r["user_uuid"],
                username=r["username"],
                points=r["points"]
            ))
        return result

    def get_global_highscores(self) -> list[HighscoreEntryResponse]:
        rows = self.repo.get_global_highscores()
        result = []
        for idx, r in enumerate(rows, start=1):
            names = r["names"].replace(",", " / ") if r["names"] else "Anonymous"
            result.append(HighscoreEntryResponse(
                rank=idx,
                user_uuid=r["user_uuid"],
                username=names,
                points=r["total_points"] or 0
            ))
        return result

    def get_user_task_stats(self, household_id: int, user_uuid: str) -> list[UserTaskStatResponse]:
        rows = self.repo.get_user_task_stats(household_id, user_uuid)
        return [
            UserTaskStatResponse(
                task_name=r["task_name"],
                completions_count=r["completions_count"],
                total_points=r["total_points"]
            ) for r in rows
        ]

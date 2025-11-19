from fastapi import APIRouter

router = APIRouter()

@router.get("/{club_id}")
def manage_club(club_id: int):
    return {"message": f"management page for club {club_id}"}

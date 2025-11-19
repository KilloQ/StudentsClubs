from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_clubs():
    return {"message": "clubs list"}

@router.get("/{club_id}")
def get_club(club_id: int):
    return {"message": f"club page {club_id}"}

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def profile():
    return {"message": "profile info"}

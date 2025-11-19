from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
def login():
    return {"message": "login endpoint"}

@router.post("/register")
def register():
    return {"message": "register endpoint"}

import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserToken, PantryItem
from app.schemas import (
    RegisterRequest,
    LoginRequest,
    ProfileUpdateRequest,
    AuthResponse,
    UserResponse,
    AuthToken,
)
from app.auth import hash_password, verify_password, create_user_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

DEMO_USER_ID = "user-demo-1"
DEMO_USER_EMAIL = "demo@recipeforge.local"


def build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        default_servings=user.default_servings,
        dietary_filters=user.dietary_filters,
        equipment=user.equipment,
        assumed_staples=user.assumed_staples,
        created_at=user.created_at.isoformat() if hasattr(user.created_at, "isoformat") else str(user.created_at),
    )


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if not email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required",
        )

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    user = User(
        id=f"usr_{secrets.token_hex(12)}",
        email=email,
        password_hash=hash_password(req.password),
        default_servings=req.default_servings or 1,
        dietary_filters_json="[]",
        equipment_json='["stovetop"]',
        assumed_staples_json='{"pepper": true, "oil": true}',
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_user_token(db, user)
    expires_at_ms = int(token.expires_at.replace(tzinfo=timezone.utc).timestamp() * 1000)

    return AuthResponse(
        user=build_user_response(user),
        token=AuthToken(
            access_token=token.token,
            token_type="bearer",
            expires_at=expires_at_ms,
        ),
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    # Generic error without disclosing which field is incorrect (plan.md Section 6.1)
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_user_token(db, user)
    expires_at_ms = int(token.expires_at.replace(tzinfo=timezone.utc).timestamp() * 1000)

    return AuthResponse(
        user=build_user_response(user),
        token=AuthToken(
            access_token=token.token,
            token_type="bearer",
            expires_at=expires_at_ms,
        ),
    )


@router.post("/demo-login", response_model=AuthResponse)
def demo_login(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == DEMO_USER_ID).first()
    if not user:
        # Create demo user if not present
        user = User(
            id=DEMO_USER_ID,
            email=DEMO_USER_EMAIL,
            password_hash=hash_password("demopassword"),
            default_servings=1,
            dietary_filters_json="[]",
            equipment_json='["stovetop", "microwave"]',
            assumed_staples_json='{"pepper": true, "oil": true}',
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_user_token(db, user)
    expires_at_ms = int(token.expires_at.replace(tzinfo=timezone.utc).timestamp() * 1000)

    return AuthResponse(
        user=build_user_response(user),
        token=AuthToken(
            access_token=token.token,
            token_type="bearer",
            expires_at=expires_at_ms,
        ),
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    if authorization:
        scheme, _, token_str = authorization.partition(" ")
        if token_str:
            db.query(UserToken).filter(UserToken.token == token_str).delete()
            db.commit()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return build_user_response(user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.default_servings is not None:
        if req.default_servings < 1 or req.default_servings > 12:
            raise HTTPException(status_code=422, detail="Servings must be between 1 and 12")
        user.default_servings = req.default_servings

    if req.dietary_filters is not None:
        user.dietary_filters = req.dietary_filters

    if req.equipment is not None:
        user.equipment = req.equipment

    if req.assumed_staples is not None:
        user.assumed_staples = req.assumed_staples

    db.commit()
    db.refresh(user)
    return build_user_response(user)


@router.delete("/account", status_code=status.HTTP_200_OK)
def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Cascades deletions via SQLAlchemy relationships and foreign keys
    db.delete(user)
    db.commit()
    return {"message": "Account deleted successfully"}

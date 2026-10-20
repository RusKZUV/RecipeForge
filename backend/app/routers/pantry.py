import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, PantryItem, Ingredient
from app.schemas import PantryItemCreate, PantryItemUpdate, PantryItemResponse
from app.auth import get_current_user
from app.expiry import compute_expiry_status

router = APIRouter(prefix="/pantry", tags=["pantry"])


def build_pantry_response(item: PantryItem) -> PantryItemResponse:
    expiry_status = compute_expiry_status(item.expires_on)
    return PantryItemResponse(
        id=item.id,
        user_id=item.user_id,
        ingredient_id=item.ingredient_id,
        custom_name=item.custom_name,
        quantity=float(item.quantity),
        unit=item.unit,
        expires_on=item.expires_on,
        created_at=item.created_at.isoformat() if hasattr(item.created_at, "isoformat") else str(item.created_at),
        updated_at=item.updated_at.isoformat() if hasattr(item.updated_at, "isoformat") else str(item.updated_at),
        expiry_status=expiry_status,
    )


@router.get("", response_model=List[PantryItemResponse])
def list_pantry_items(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(PantryItem).filter(PantryItem.user_id == user.id).all()
    return [build_pantry_response(i) for i in items]


@router.post("", response_model=PantryItemResponse, status_code=status.HTTP_201_CREATED)
def add_pantry_item(
    req: PantryItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Quantity must be greater than zero",
        )

    if not req.ingredient_id and not req.custom_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either ingredient_id or custom_name must be provided",
        )

    # Validate ingredient if provided
    if req.ingredient_id:
        ing = db.query(Ingredient).filter(Ingredient.id == req.ingredient_id).first()
        if not ing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingredient not found in catalog",
            )

    item = PantryItem(
        id=f"pantry-{secrets.token_hex(8)}",
        user_id=user.id,
        ingredient_id=req.ingredient_id,
        custom_name=req.custom_name,
        quantity=req.quantity,
        unit=req.unit,
        expires_on=req.expires_on,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return build_pantry_response(item)


@router.patch("/{item_id}", response_model=PantryItemResponse)
def update_pantry_item(
    item_id: str,
    req: PantryItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pantry item not found")

    if item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Resource belongs to another user")

    if req.quantity is not None:
        if req.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Quantity must be greater than zero")
        item.quantity = req.quantity

    if req.unit is not None:
        item.unit = req.unit

    if req.ingredient_id is not None:
        item.ingredient_id = req.ingredient_id

    if req.custom_name is not None:
        item.custom_name = req.custom_name

    if req.expires_on is not None:
        item.expires_on = req.expires_on

    db.commit()
    db.refresh(item)
    return build_pantry_response(item)


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_pantry_item(
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pantry item not found")

    if item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Resource belongs to another user")

    db.delete(item)
    db.commit()
    return {"message": "Pantry item deleted successfully"}

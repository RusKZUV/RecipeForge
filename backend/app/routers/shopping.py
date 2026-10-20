import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, ShoppingListItem, PantryItem
from app.schemas import (
    ShoppingItemCreate,
    ShoppingItemUpdate,
    ShoppingItemResponse,
    MarkBoughtRequest,
)
from app.auth import get_current_user

router = APIRouter(prefix="/shopping", tags=["shopping"])


def build_shopping_response(item: ShoppingListItem) -> ShoppingItemResponse:
    return ShoppingItemResponse(
        id=item.id,
        user_id=item.user_id,
        ingredient_id=item.ingredient_id,
        custom_name=item.custom_name,
        quantity=float(item.quantity),
        unit=item.unit,
        source_recipes=item.source_recipes,
        servings=item.servings,
        checked=item.checked,
        estimated_price_kzt=item.estimated_price_kzt,
    )


@router.get("", response_model=List[ShoppingItemResponse])
def list_shopping_items(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(ShoppingListItem).filter(ShoppingListItem.user_id == user.id).all()
    return [build_shopping_response(i) for i in items]


@router.post("", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def add_shopping_item(
    req: ShoppingItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.quantity <= 0:
        raise HTTPException(status_code=422, detail="Quantity must be greater than zero")

    item = ShoppingListItem(
        id=f"shop-{secrets.token_hex(8)}",
        user_id=user.id,
        ingredient_id=req.ingredient_id,
        custom_name=req.custom_name,
        quantity=req.quantity,
        unit=req.unit,
        source_recipes_json="[]",
        servings=req.servings or 1,
        checked=False,
        estimated_price_kzt=req.estimated_price_kzt,
    )
    if req.source_recipes:
        item.source_recipes = req.source_recipes

    db.add(item)
    db.commit()
    db.refresh(item)
    return build_shopping_response(item)


@router.patch("/{item_id}", response_model=ShoppingItemResponse)
def update_shopping_item(
    item_id: str,
    req: ShoppingItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    if item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Resource belongs to another user")

    if req.quantity is not None:
        if req.quantity <= 0:
            raise HTTPException(status_code=422, detail="Quantity must be greater than zero")
        item.quantity = req.quantity

    if req.unit is not None:
        item.unit = req.unit

    if req.checked is not None:
        item.checked = req.checked

    if req.ingredient_id is not None:
        item.ingredient_id = req.ingredient_id

    if req.custom_name is not None:
        item.custom_name = req.custom_name

    if req.servings is not None:
        item.servings = req.servings

    if req.estimated_price_kzt is not None:
        item.estimated_price_kzt = req.estimated_price_kzt

    db.commit()
    db.refresh(item)
    return build_shopping_response(item)


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_shopping_item(
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    if item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Resource belongs to another user")

    db.delete(item)
    db.commit()
    return {"message": "Shopping item deleted successfully"}


@router.post("/{item_id}/bought", status_code=status.HTTP_200_OK)
def mark_item_bought(
    item_id: str,
    req: Optional[MarkBoughtRequest] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    if item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Resource belongs to another user")

    # Transfer into pantry
    pantry_item = PantryItem(
        id=f"pantry-{secrets.token_hex(8)}",
        user_id=user.id,
        ingredient_id=req.ingredient_id if req and req.ingredient_id is not None else item.ingredient_id,
        custom_name=req.custom_name if req and req.custom_name is not None else item.custom_name,
        quantity=req.quantity if req and req.quantity is not None else item.quantity,
        unit=req.unit if req and req.unit is not None else item.unit,
        expires_on=req.expires_on if req and req.expires_on is not None else None,
    )
    db.add(pantry_item)

    # Delete or mark checked in shopping list
    db.delete(item)
    db.commit()

    return {"message": "Item moved to pantry successfully", "pantry_item_id": pantry_item.id}

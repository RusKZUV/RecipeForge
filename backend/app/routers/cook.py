from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, PantryItem, Recipe
from app.schemas import CookCompleteRequest
from app.auth import get_current_user

router = APIRouter(prefix="/cook", tags=["cook"])


@router.post("/complete", status_code=status.HTTP_200_OK)
def complete_cook_session(
    req: CookCompleteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipe = db.query(Recipe).filter(Recipe.id == req.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    pantry_items = db.query(PantryItem).filter(PantryItem.user_id == user.id).all()
    pantry_by_ing = {p.ingredient_id: p for p in pantry_items if p.ingredient_id}

    scale = req.servings / max(1, recipe.servings)

    # If explicit deductions provided, use them; otherwise deduct recipe ingredients
    if req.deductions:
        for ded in req.deductions:
            if ded.ingredient_id and ded.ingredient_id in pantry_by_ing:
                item = pantry_by_ing[ded.ingredient_id]
                new_qty = float(item.quantity) - ded.deduct_quantity
                if new_qty <= 0:
                    db.delete(item)
                else:
                    item.quantity = new_qty
    else:
        for ri in recipe.ingredients:
            if ri.ingredient_id and ri.ingredient_id in pantry_by_ing:
                item = pantry_by_ing[ri.ingredient_id]
                needed = float(ri.quantity) * scale
                new_qty = float(item.quantity) - needed
                if new_qty <= 0:
                    db.delete(item)
                else:
                    item.quantity = new_qty

    db.commit()
    return {"message": "Pantry updated successfully after cooking"}

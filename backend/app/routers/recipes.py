import secrets
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User, Recipe, RecipeIngredient, RecipeStep
from app.schemas import (
    RecipeCreate,
    RecipeUpdate,
    RecipeResponse,
    RecipeListResponse,
    RecipeIngredientSchema,
    RecipeStepSchema,
)
from app.auth import get_current_user

router = APIRouter(prefix="/recipes", tags=["recipes"])


def build_recipe_response(recipe: Recipe) -> RecipeResponse:
    return RecipeResponse(
        id=recipe.id,
        owner_id=recipe.owner_id,
        title=recipe.title,
        servings=recipe.servings,
        time_minutes=recipe.time_minutes,
        equipment=recipe.equipment,
        is_seed=recipe.is_seed,
        source=recipe.source,
        license_note=recipe.license_note,
        ingredients=[
            RecipeIngredientSchema(
                id=i.id,
                ingredient_id=i.ingredient_id,
                custom_name=i.custom_name,
                quantity=float(i.quantity),
                unit=i.unit,
                optional=i.optional,
            )
            for i in recipe.ingredients
        ],
        steps=[
            RecipeStepSchema(
                id=s.id,
                position=s.position,
                text=s.text,
                timer_seconds=s.timer_seconds,
            )
            for s in recipe.steps
        ],
    )


@router.get("", response_model=RecipeListResponse)
def list_recipes(
    query: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Visible recipes: public seed recipes OR user's private recipes
    q = db.query(Recipe).filter(or_(Recipe.is_seed == True, Recipe.owner_id == user.id))

    if query:
        q = q.filter(Recipe.title.ilike(f"%{query.strip()}%"))

    total = q.count()
    recipes = q.offset(offset).limit(limit).all()

    return RecipeListResponse(
        items=[build_recipe_response(r) for r in recipes],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(
    recipe_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    if not recipe.is_seed and recipe.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Resource belongs to another user")

    return build_recipe_response(recipe)


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    req: RecipeCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not req.title.strip():
        raise HTTPException(status_code=422, detail="Title cannot be empty")

    if not req.ingredients:
        raise HTTPException(status_code=422, detail="Recipe must have at least one ingredient")

    if not req.steps:
        raise HTTPException(status_code=422, detail="Recipe must have at least one step")

    for ing in req.ingredients:
        if ing.quantity <= 0:
            raise HTTPException(status_code=422, detail="Ingredient quantities must be greater than zero")

    recipe_id = f"rcp_{secrets.token_hex(8)}"
    recipe = Recipe(
        id=recipe_id,
        owner_id=user.id,
        title=req.title.strip(),
        servings=req.servings,
        time_minutes=req.time_minutes,
        equipment_json="[]",
        is_seed=False,
        source=req.source,
        license_note=req.license_note,
    )
    recipe.equipment = req.equipment
    db.add(recipe)
    db.flush()

    for ing_data in req.ingredients:
        db_ing = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ing_data.ingredient_id,
            custom_name=ing_data.custom_name,
            quantity=ing_data.quantity,
            unit=ing_data.unit,
            optional=ing_data.optional,
        )
        db.add(db_ing)

    for idx, step_data in enumerate(req.steps, start=1):
        db_step = RecipeStep(
            recipe_id=recipe.id,
            position=idx,
            text=step_data.text,
            timer_seconds=step_data.timer_seconds,
        )
        db.add(db_step)

    db.commit()
    db.refresh(recipe)
    return build_recipe_response(recipe)


@router.patch("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(
    recipe_id: str,
    req: RecipeUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    if recipe.is_seed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit seed recipes")

    if recipe.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Resource belongs to another user")

    if req.title is not None:
        if not req.title.strip():
            raise HTTPException(status_code=422, detail="Title cannot be empty")
        recipe.title = req.title.strip()

    if req.servings is not None:
        recipe.servings = req.servings

    if req.time_minutes is not None:
        recipe.time_minutes = req.time_minutes

    if req.equipment is not None:
        recipe.equipment = req.equipment

    if req.ingredients is not None:
        if not req.ingredients:
            raise HTTPException(status_code=422, detail="Recipe must have at least one ingredient")
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
        for ing_data in req.ingredients:
            db_ing = RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ing_data.ingredient_id,
                custom_name=ing_data.custom_name,
                quantity=ing_data.quantity,
                unit=ing_data.unit,
                optional=ing_data.optional,
            )
            db.add(db_ing)

    if req.steps is not None:
        if not req.steps:
            raise HTTPException(status_code=422, detail="Recipe must have at least one step")
        db.query(RecipeStep).filter(RecipeStep.recipe_id == recipe.id).delete()
        for idx, step_data in enumerate(req.steps, start=1):
            db_step = RecipeStep(
                recipe_id=recipe.id,
                position=idx,
                text=step_data.text,
                timer_seconds=step_data.timer_seconds,
            )
            db.add(db_step)

    db.commit()
    db.refresh(recipe)
    return build_recipe_response(recipe)


@router.delete("/{recipe_id}", status_code=status.HTTP_200_OK)
def delete_recipe(
    recipe_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    if recipe.is_seed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete seed recipes")

    if recipe.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Resource belongs to another user")

    db.delete(recipe)
    db.commit()
    return {"message": "Recipe deleted successfully"}

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User, PantryItem, Recipe, Ingredient, SubstitutionRule
from app.auth import get_current_user
from app.config import config
from app.expiry import compute_expiry_status
from app.schemas import RecipeResponse, RecipeIngredientSchema, RecipeStepSchema

router = APIRouter(tags=["matching"])


class MatchResult:
    def __init__(
        self,
        recipe: Recipe,
        coverage: float,
        urgency: float,
        missing_cost_score: float,
        fit: float,
        final_score: float,
        missing_items: List[Dict[str, Any]],
        used_pantry_items: List[Dict[str, Any]],
        substitutions: List[Dict[str, Any]],
    ):
        self.recipe = recipe
        self.coverage = coverage
        self.urgency = urgency
        self.missing_cost_score = missing_cost_score
        self.fit = fit
        self.final_score = final_score
        self.missing_items = missing_items
        self.used_pantry_items = used_pantry_items
        self.substitutions = substitutions


@router.get("/matches")
def get_recipe_matches(
    sort_by: str = Query("balanced"),
    min_coverage: Optional[float] = Query(None),
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pantry_items = db.query(PantryItem).filter(PantryItem.user_id == user.id).all()
    pantry_by_ing: Dict[str, List[PantryItem]] = {}
    for p in pantry_items:
        if p.ingredient_id:
            pantry_by_ing.setdefault(p.ingredient_id, []).append(p)

    all_ingredients = {ing.id: ing for ing in db.query(Ingredient).all()}
    sub_rules = db.query(SubstitutionRule).all()
    subs_by_from: Dict[str, List[SubstitutionRule]] = {}
    for rule in sub_rules:
        subs_by_from.setdefault(rule.from_ingredient, []).append(rule)

    # Get candidate recipes
    candidate_recipes = db.query(Recipe).filter(
        or_(Recipe.is_seed == True, Recipe.owner_id == user.id)
    ).all()

    user_diet_filters = set(user.dietary_filters or [])
    user_equipment = set(user.equipment or ["stovetop"])
    user_assumed_staples = user.assumed_staples or {}

    matches: List[MatchResult] = []

    for r in candidate_recipes:
        # 1. Hard filter: Equipment
        if r.equipment:
            if not all(eq in user_equipment for eq in r.equipment):
                continue

        # 2. Hard filter: Dietary flags
        # Evaluate each ingredient in recipe against user dietary filters
        diet_violation = False
        for ri in r.ingredients:
            if ri.ingredient_id and ri.ingredient_id in all_ingredients:
                ing = all_ingredients[ri.ingredient_id]
                flags = ing.flags or {}
                if "vegetarian" in user_diet_filters and flags.get("contains_meat", False):
                    diet_violation = True
                    break
                if "vegan" in user_diet_filters and (flags.get("contains_meat", False) or flags.get("contains_animal_product", False)):
                    diet_violation = True
                    break
                if "gluten_free" in user_diet_filters and flags.get("contains_gluten", False):
                    diet_violation = True
                    break
                if "dairy_free" in user_diet_filters and flags.get("contains_dairy", False):
                    diet_violation = True
                    break
                if "nut_free" in user_diet_filters and flags.get("contains_nuts", False):
                    diet_violation = True
                    break
        if diet_violation:
            continue

        # 3. Calculate components
        required_ings = []
        for ri in r.ingredients:
            if ri.optional:
                continue
            # Check assumed staple
            is_staple = False
            if ri.ingredient_id in all_ingredients:
                if all_ingredients[ri.ingredient_id].assumed_staple:
                    is_staple = True
                elif ri.ingredient_id in ["ing-oil"] and user_assumed_staples.get("oil", False):
                    is_staple = True
                elif ri.ingredient_id in ["ing-pepper"] and user_assumed_staples.get("pepper", False):
                    is_staple = True
            if not is_staple:
                required_ings.append(ri)

        if not required_ings:
            # All items are staples or optional
            coverage = 1.0
            missing_cost_kzt = 0
            missing_items = []
            used_pantry = []
            applied_subs = []
        else:
            score_sum = 0.0
            missing_cost_kzt = 0
            missing_items = []
            used_pantry = []
            applied_subs = []

            for ri in required_ings:
                pantry_matches = pantry_by_ing.get(ri.ingredient_id, [])
                # Total available quantity
                avail_qty = sum(float(p.quantity) for p in pantry_matches)
                needed_qty = float(ri.quantity) * (user.default_servings / max(1, r.servings))

                if avail_qty >= needed_qty:
                    score_sum += 1.0
                    used_pantry.extend(pantry_matches)
                elif avail_qty > 0:
                    fraction = avail_qty / needed_qty
                    score_sum += fraction
                    used_pantry.extend(pantry_matches)
                    diff_qty = needed_qty - avail_qty
                    # Estimate cost of remaining
                    ing_meta = all_ingredients.get(ri.ingredient_id)
                    price = ing_meta.price_per_base_unit if ing_meta and ing_meta.price_per_base_unit else 0
                    missing_cost_kzt += int(price * diff_qty / 1000 if ing_meta and ing_meta.base_unit == "kg" else price)
                    missing_items.append({"ingredient_id": ri.ingredient_id, "missing_quantity": diff_qty, "unit": ri.unit})
                else:
                    # Check substitutions
                    sub_found = False
                    for sub in subs_by_from.get(ri.ingredient_id, []):
                        sub_pantry = pantry_by_ing.get(sub.to_ingredient, [])
                        sub_avail = sum(float(p.quantity) for p in sub_pantry)
                        if sub_avail > 0:
                            sub_quality = min(float(sub.quality), config.SUBSTITUTION_QUALITY_CAP)
                            score_sum += sub_quality
                            applied_subs.append({
                                "from_ingredient": sub.from_ingredient,
                                "to_ingredient": sub.to_ingredient,
                                "quality": sub_quality,
                                "note": sub.note,
                            })
                            used_pantry.extend(sub_pantry)
                            sub_found = True
                            break

                    if not sub_found:
                        ing_meta = all_ingredients.get(ri.ingredient_id)
                        price = ing_meta.price_per_base_unit if ing_meta and ing_meta.price_per_base_unit else 0
                        missing_cost_kzt += int(price)
                        missing_items.append({"ingredient_id": ri.ingredient_id, "missing_quantity": needed_qty, "unit": ri.unit})

            coverage = score_sum / len(required_ings)

        # Urgency calculation
        urgency_sum = 0.0
        for p in used_pantry:
            status = compute_expiry_status(p.expires_on)
            if status == "expires_today":
                urgency_sum += 1.0
            elif status == "expiring_soon":
                urgency_sum += 0.5
        urgency = min(1.0, urgency_sum)

        # Missing cost score
        missing_cost_score = 1.0 - min(1.0, missing_cost_kzt / config.REFERENCE_BUDGET_KZT)

        # Fit score (time based)
        if r.time_minutes <= 20:
            fit = 1.0
        elif r.time_minutes >= 90:
            fit = 0.0
        else:
            fit = 1.0 - (r.time_minutes - 20) / 70.0

        final_score = (
            config.WEIGHT_COVERAGE * coverage
            + config.WEIGHT_URGENCY * urgency
            + config.WEIGHT_MISSING_COST * missing_cost_score
            + config.WEIGHT_FIT * fit
        )

        matches.append(
            MatchResult(
                recipe=r,
                coverage=coverage,
                urgency=urgency,
                missing_cost_score=missing_cost_score,
                fit=fit,
                final_score=final_score,
                missing_items=missing_items,
                used_pantry_items=used_pantry,
                substitutions=applied_subs,
            )
        )

    # Filter by minimum coverage if specified
    min_cov = min_coverage if min_coverage is not None else config.MIN_COVERAGE_FILTER_DEFAULT
    matches = [m for m in matches if m.coverage >= min_cov]

    # Deterministic tie-breaking: final_score DESC, urgency DESC, missing_cost DESC, title ASC, id ASC
    matches.sort(
        key=lambda m: (
            -round(m.final_score, 4),
            -round(m.urgency, 4),
            -round(m.missing_cost_score, 4),
            m.recipe.title,
            m.recipe.id,
        )
    )

    total = len(matches)
    paged = matches[offset : offset + limit]

    items = []
    for m in paged:
        items.append({
            "recipe": RecipeResponse(
                id=m.recipe.id,
                owner_id=m.recipe.owner_id,
                title=m.recipe.title,
                servings=m.recipe.servings,
                time_minutes=m.recipe.time_minutes,
                equipment=m.recipe.equipment,
                is_seed=m.recipe.is_seed,
                source=m.recipe.source,
                license_note=m.recipe.license_note,
                ingredients=[
                    RecipeIngredientSchema(
                        id=i.id,
                        ingredient_id=i.ingredient_id,
                        custom_name=i.custom_name,
                        quantity=float(i.quantity),
                        unit=i.unit,
                        optional=i.optional,
                    )
                    for i in m.recipe.ingredients
                ],
                steps=[
                    RecipeStepSchema(
                        id=s.id,
                        position=s.position,
                        text=s.text,
                        timer_seconds=s.timer_seconds,
                    )
                    for s in m.recipe.steps
                ],
            ),
            "score": round(m.final_score, 4),
            "coverage": round(m.coverage, 2),
            "urgency": round(m.urgency, 2),
            "missing_cost_score": round(m.missing_cost_score, 2),
            "fit": round(m.fit, 2),
            "missing_items": m.missing_items,
            "substitutions": m.substitutions,
        })

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }

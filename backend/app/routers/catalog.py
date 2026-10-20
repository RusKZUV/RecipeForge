from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Ingredient, IngredientAlias, SubstitutionRule
from app.schemas import IngredientResponse, SubstitutionRuleResponse

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/ingredients", response_model=List[IngredientResponse])
def get_catalog_ingredients(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).all()
    result = []
    for ing in ingredients:
        result.append(
            IngredientResponse(
                id=ing.id,
                canonical_name=ing.canonical_name,
                category=ing.category,
                base_unit=ing.base_unit,
                price_per_base_unit=ing.price_per_base_unit,
                assumed_staple=ing.assumed_staple,
                flags=ing.flags,
                unit_approximations=ing.unit_approximations,
                variant_of=ing.variant_of,
            )
        )
    return result


@router.get("/substitutions", response_model=List[SubstitutionRuleResponse])
def get_substitution_rules(db: Session = Depends(get_db)):
    rules = db.query(SubstitutionRule).all()
    return [
        SubstitutionRuleResponse(
            id=r.id,
            from_ingredient=r.from_ingredient,
            to_ingredient=r.to_ingredient,
            ratio=float(r.ratio),
            quality=float(r.quality),
            note=r.note,
            context=r.context,
            tags=r.tags,
        )
        for r in rules
    ]

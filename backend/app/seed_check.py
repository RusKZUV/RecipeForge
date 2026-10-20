import sys
from app.database import SessionLocal
from app.models import Recipe, Ingredient, IngredientAlias, SubstitutionRule

def run_seed_check() -> int:
    db = SessionLocal()
    errors = []
    try:
        ingredients = db.query(Ingredient).all()
        if len(ingredients) < 15:
            errors.append(f"Insufficient ingredients: found {len(ingredients)}, expected >= 15")

        for ing in ingredients:
            if not ing.id or not ing.canonical_name:
                errors.append(f"Invalid ingredient definition: {ing.id}")
            if ing.price_per_base_unit is not None and ing.price_per_base_unit < 0:
                errors.append(f"Negative price on ingredient {ing.id}: {ing.price_per_base_unit}")

        recipes = db.query(Recipe).filter(Recipe.is_seed == True).all()
        if len(recipes) < 25:
            errors.append(f"Insufficient seed recipes: found {len(recipes)}, expected >= 25")

        for r in recipes:
            if not r.id or not r.title:
                errors.append(f"Invalid recipe metadata: {r.id}")
            if len(r.ingredients) == 0:
                errors.append(f"Recipe {r.id} has no ingredients")
            for ri in r.ingredients:
                if float(ri.quantity) <= 0:
                    errors.append(f"Recipe {r.id} has non-positive quantity for ingredient {ri.ingredient_id}")
            if len(r.steps) == 0:
                errors.append(f"Recipe {r.id} has no steps")

        subs = db.query(SubstitutionRule).all()
        if len(subs) < 5:
            errors.append(f"Insufficient substitution rules: found {len(subs)}, expected >= 5")

        for sub in subs:
            if float(sub.quality) <= 0 or float(sub.quality) > 1.0:
                errors.append(f"Invalid substitution quality for {sub.id}: {sub.quality}")
            if float(sub.ratio) <= 0:
                errors.append(f"Invalid substitution ratio for {sub.id}: {sub.ratio}")

        if errors:
            print(f"FAILED seed-check with {len(errors)} errors:")
            for err in errors:
                print(f"  - {err}")
            return 1
        else:
            print(f"PASSED seed-check: {len(ingredients)} ingredients, {len(recipes)} seed recipes, {len(subs)} substitution rules verified cleanly.")
            return 0
    finally:
        db.close()

if __name__ == "__main__":
    sys.exit(run_seed_check())

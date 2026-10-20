import json
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    default_servings = Column(Integer, default=1, nullable=False)
    dietary_filters_json = Column(Text, default="[]", nullable=False)
    equipment_json = Column(Text, default="[]", nullable=False)
    assumed_staples_json = Column(Text, default='{"pepper": true, "oil": true}', nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    tokens = relationship("UserToken", back_populates="user", cascade="all, delete-orphan")
    pantry_items = relationship("PantryItem", back_populates="user", cascade="all, delete-orphan")
    recipes = relationship("Recipe", back_populates="owner", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingListItem", back_populates="user", cascade="all, delete-orphan")

    @property
    def dietary_filters(self) -> List[str]:
        try:
            return json.loads(self.dietary_filters_json)
        except Exception:
            return []

    @dietary_filters.setter
    def dietary_filters(self, val: List[str]):
        self.dietary_filters_json = json.dumps(val or [])

    @property
    def equipment(self) -> List[str]:
        try:
            return json.loads(self.equipment_json)
        except Exception:
            return []

    @equipment.setter
    def equipment(self, val: List[str]):
        self.equipment_json = json.dumps(val or [])

    @property
    def assumed_staples(self) -> dict:
        try:
            return json.loads(self.assumed_staples_json)
        except Exception:
            return {"pepper": True, "oil": True}

    @assumed_staples.setter
    def assumed_staples(self, val: dict):
        self.assumed_staples_json = json.dumps(val or {})


class UserToken(Base):
    __tablename__ = "user_tokens"

    token = Column(String(255), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="tokens")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(String(64), primary_key=True)
    canonical_name = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(64), nullable=False)
    base_unit = Column(String(32), nullable=False)
    price_per_base_unit = Column(Integer, nullable=True)  # Integer tenge (KZT)
    assumed_staple = Column(Boolean, default=False, nullable=False)
    flags_json = Column(Text, default="{}", nullable=False)
    unit_approximations_json = Column(Text, default="{}", nullable=False)
    variant_of = Column(String(64), ForeignKey("ingredients.id", ondelete="SET NULL"), nullable=True)

    aliases = relationship("IngredientAlias", back_populates="ingredient", cascade="all, delete-orphan")

    @property
    def flags(self) -> dict:
        try:
            return json.loads(self.flags_json)
        except Exception:
            return {}

    @flags.setter
    def flags(self, val: dict):
        self.flags_json = json.dumps(val or {})

    @property
    def unit_approximations(self) -> dict:
        try:
            return json.loads(self.unit_approximations_json)
        except Exception:
            return {}

    @unit_approximations.setter
    def unit_approximations(self, val: dict):
        self.unit_approximations_json = json.dumps(val or {})


class IngredientAlias(Base):
    __tablename__ = "ingredient_aliases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ingredient_id = Column(String(64), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    alias = Column(String(255), index=True, nullable=False)

    ingredient = relationship("Ingredient", back_populates="aliases")


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    ingredient_id = Column(String(64), ForeignKey("ingredients.id", ondelete="SET NULL"), nullable=True)
    custom_name = Column(String(255), nullable=True)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(32), nullable=False)
    expires_on = Column(String(10), nullable=True)  # YYYY-MM-DD ISO string
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="pantry_items")
    ingredient = relationship("Ingredient")


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(String(64), primary_key=True)
    owner_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    title = Column(String(255), nullable=False)
    servings = Column(Integer, default=1, nullable=False)
    time_minutes = Column(Integer, default=15, nullable=False)
    equipment_json = Column(Text, default="[]", nullable=False)
    is_seed = Column(Boolean, default=False, nullable=False)
    source = Column(String(255), nullable=True)
    license_note = Column(String(255), nullable=True)

    owner = relationship("User", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeIngredient.id")
    steps = relationship("RecipeStep", back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeStep.position")

    @property
    def equipment(self) -> List[str]:
        try:
            return json.loads(self.equipment_json)
        except Exception:
            return []

    @equipment.setter
    def equipment(self, val: List[str]):
        self.equipment_json = json.dumps(val or [])


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipe_id = Column(String(64), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(String(64), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=True)
    custom_name = Column(String(255), nullable=True)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(32), nullable=False)
    optional = Column(Boolean, default=False, nullable=False)

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient")


class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipe_id = Column(String(64), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    timer_seconds = Column(Integer, nullable=True)

    recipe = relationship("Recipe", back_populates="steps")


class SubstitutionRule(Base):
    __tablename__ = "substitution_rules"

    id = Column(String(64), primary_key=True)
    from_ingredient = Column(String(64), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    to_ingredient = Column(String(64), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    ratio = Column(Numeric(5, 2), default=1.0, nullable=False)
    quality = Column(Numeric(3, 2), default=0.8, nullable=False)
    note = Column(String(255), nullable=False)
    context = Column(String(64), default="any", nullable=False)
    tags_json = Column(Text, default="[]", nullable=False)

    @property
    def tags(self) -> List[str]:
        try:
            return json.loads(self.tags_json)
        except Exception:
            return []

    @tags.setter
    def tags(self, val: List[str]):
        self.tags_json = json.dumps(val or [])


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    ingredient_id = Column(String(64), ForeignKey("ingredients.id", ondelete="SET NULL"), nullable=True)
    custom_name = Column(String(255), nullable=True)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(32), nullable=False)
    source_recipes_json = Column(Text, default="[]", nullable=False)
    servings = Column(Integer, default=1, nullable=False)
    checked = Column(Boolean, default=False, nullable=False)
    estimated_price_kzt = Column(Integer, nullable=True)  # Integer tenge (KZT)

    user = relationship("User", back_populates="shopping_items")
    ingredient = relationship("Ingredient")

    @property
    def source_recipes(self) -> List[str]:
        try:
            return json.loads(self.source_recipes_json)
        except Exception:
            return []

    @source_recipes.setter
    def source_recipes(self, val: List[str]):
        self.source_recipes_json = json.dumps(val or [])

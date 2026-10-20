from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: int  # Epoch ms or seconds


class AssumedStaples(BaseModel):
    pepper: bool = True
    oil: bool = True


class UserProfile(BaseModel):
    dietary_filters: List[str] = Field(default_factory=list)
    equipment: List[str] = Field(default_factory=list)
    default_servings: int = 1
    assumed_staples: Dict[str, bool] = Field(default_factory=lambda: {"pepper": True, "oil": True})


class UserResponse(BaseModel):
    id: str
    email: str
    default_servings: int = 1
    dietary_filters: List[str] = Field(default_factory=list)
    equipment: List[str] = Field(default_factory=list)
    assumed_staples: Dict[str, bool] = Field(default_factory=lambda: {"pepper": True, "oil": True})
    created_at: str


class AuthResponse(BaseModel):
    user: UserResponse
    token: AuthToken


class RegisterRequest(BaseModel):
    email: str
    password: str
    default_servings: Optional[int] = 1


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    dietary_filters: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    default_servings: Optional[int] = None
    assumed_staples: Optional[Dict[str, bool]] = None


class IngredientResponse(BaseModel):
    id: str
    canonical_name: str
    category: str
    base_unit: str
    price_per_base_unit: Optional[int] = None
    assumed_staple: bool = False
    flags: Dict[str, bool] = Field(default_factory=dict)
    unit_approximations: Dict[str, float] = Field(default_factory=dict)
    variant_of: Optional[str] = None


class IngredientAliasResponse(BaseModel):
    ingredient_id: str
    alias: str


class PantryItemCreate(BaseModel):
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: float
    unit: str
    expires_on: Optional[str] = None


class PantryItemUpdate(BaseModel):
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expires_on: Optional[str] = None


class PantryItemResponse(BaseModel):
    id: str
    user_id: str
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: float
    unit: str
    expires_on: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    expiry_status: Optional[str] = None


class RecipeIngredientSchema(BaseModel):
    id: Optional[int] = None
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: float
    unit: str
    optional: bool = False


class RecipeStepSchema(BaseModel):
    id: Optional[int] = None
    position: int
    text: str
    timer_seconds: Optional[int] = None


class RecipeCreate(BaseModel):
    title: str
    servings: int = 1
    time_minutes: int = 20
    equipment: List[str] = Field(default_factory=list)
    ingredients: List[RecipeIngredientSchema] = Field(default_factory=list)
    steps: List[RecipeStepSchema] = Field(default_factory=list)
    source: Optional[str] = None
    license_note: Optional[str] = None


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    servings: Optional[int] = None
    time_minutes: Optional[int] = None
    equipment: Optional[List[str]] = None
    ingredients: Optional[List[RecipeIngredientSchema]] = None
    steps: Optional[List[RecipeStepSchema]] = None
    source: Optional[str] = None
    license_note: Optional[str] = None


class RecipeResponse(BaseModel):
    id: str
    owner_id: Optional[str] = None
    title: str
    servings: int
    time_minutes: int
    equipment: List[str]
    is_seed: bool
    source: Optional[str] = None
    license_note: Optional[str] = None
    ingredients: List[RecipeIngredientSchema]
    steps: List[RecipeStepSchema]


class RecipeListResponse(BaseModel):
    items: List[RecipeResponse]
    total: int
    limit: int
    offset: int


class SubstitutionRuleResponse(BaseModel):
    id: str
    from_ingredient: str
    to_ingredient: str
    ratio: float
    quality: float
    note: str
    context: str = "any"
    tags: List[str] = Field(default_factory=list)


class ShoppingItemCreate(BaseModel):
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: float
    unit: str
    source_recipes: Optional[List[str]] = None
    servings: Optional[int] = 1
    estimated_price_kzt: Optional[int] = None


class ShoppingItemUpdate(BaseModel):
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    source_recipes: Optional[List[str]] = None
    servings: Optional[int] = None
    checked: Optional[bool] = None
    estimated_price_kzt: Optional[int] = None


class ShoppingItemResponse(BaseModel):
    id: str
    user_id: str
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: float
    unit: str
    source_recipes: List[str] = Field(default_factory=list)
    servings: int = 1
    checked: bool = False
    estimated_price_kzt: Optional[int] = None


class MarkBoughtRequest(BaseModel):
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expires_on: Optional[str] = None


class DeductionItem(BaseModel):
    ingredient_id: Optional[str] = None
    custom_name: Optional[str] = None
    deduct_quantity: float
    unit: str


class CookCompleteRequest(BaseModel):
    recipe_id: str
    servings: int = 1
    deductions: Optional[List[DeductionItem]] = None

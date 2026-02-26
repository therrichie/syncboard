from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- USER SÉMÁK ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- ACTIVITY LOG SÉMÁK ---
class ActivityLogBase(BaseModel):
    action: str
    details: Optional[str] = None
    timestamp: datetime
    board_id: int
    user_id: int

class ActivityLog(ActivityLogBase):
    id: int
    class Config:
        from_attributes = True

# --- CARD SÉMÁK ---
class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0

class CardCreate(CardBase):
    column_id: int

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    column_id: Optional[int] = None

class Card(CardBase):
    id: int
    column_id: int
    creator_id: int
    class Config:
        from_attributes = True

# --- COLUMN SÉMÁK ---
class ColumnBase(BaseModel):
    title: str
    order: int = 0

class ColumnCreate(ColumnBase):
    board_id: int

class ColumnUpdate(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None

class Column(BaseModel):
    id: int
    title: str
    order: int
    cards: List[Card] = []
    class Config:
        from_attributes = True

# --- BOARD SÉMÁK ---
class BoardBase(BaseModel):
    title: str

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    title: Optional[str] = None

class Board(BoardBase):
    id: int
    owner_id: int
    columns: List[Column] = []
    class Config:
        from_attributes = True

# --- TOKEN SÉMÁK ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
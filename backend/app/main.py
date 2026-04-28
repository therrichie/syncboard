from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from . import models, schemas, crud, auth, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SyncBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Engedélyezzük a React kliens címét
    allow_credentials=True,
    allow_methods=["*"], # Minden metódust (GET, POST, stb.) engedélyezünk
    allow_headers=["*"], # Minden fejlécet engedélyezünk
)

@app.get("/")
def read_root():
    return {"message": "SyncBoard API is running!", "version": "0.2.0"}

# --- AUTH ÉS USER ---
@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- BOARD CRUD ---
@app.post("/boards/", response_model=schemas.Board)
def create_board(board: schemas.BoardCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_board(db=db, board=board, user_id=current_user.id)

@app.get("/boards/", response_model=List[schemas.Board])
def read_boards(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_boards_by_user(db, user_id=current_user.id)

@app.delete("/boards/{board_id}")
def delete_board(board_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not crud.delete_board(db, board_id):
        raise HTTPException(status_code=404, detail="Board not found")
    return {"message": "Board deleted successfully"}

# --- COLUMN CRUD ---
@app.post("/columns/", response_model=schemas.Column)
def create_column(column: schemas.ColumnCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_column(db=db, column=column)

@app.put("/columns/{column_id}", response_model=schemas.Column)
def update_column(column_id: int, column_update: schemas.ColumnUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.update_column(db, column_id, column_update)

@app.delete("/columns/{column_id}")
def delete_column(column_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not crud.delete_column(db, column_id):
        raise HTTPException(status_code=404, detail="Column not found")
    return {"message": "Column deleted successfully"}

# --- CARD CRUD ---
@app.post("/cards/", response_model=schemas.Card)
def create_card(card: schemas.CardCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_card(db=db, card=card, user_id=current_user.id)

@app.put("/cards/{card_id}", response_model=schemas.Card)
def update_card(card_id: int, card_update: schemas.CardUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.update_card(db, card_id, card_update, current_user.id)

@app.delete("/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not crud.delete_card(db, card_id, current_user.id):
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card deleted successfully"}
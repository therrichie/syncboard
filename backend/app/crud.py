from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# --- SEGÉDFÜGGVÉNY A NAPLÓZÁSHOZ ---
def create_activity_log(db: Session, action: str, board_id: int, user_id: int, details: str = None):
    db_log = models.ActivityLog(
        action=action,
        board_id=board_id,
        user_id=user_id,
        details=details
    )
    db.add(db_log)
    db.commit()

# --- USER MŰVELETEK ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- BOARD MŰVELETEK ---
def get_board(db: Session, board_id: int):
    return db.query(models.Board).filter(models.Board.id == board_id).first()

def create_board(db: Session, board: schemas.BoardCreate, user_id: int):
    db_board = models.Board(title=board.title, owner_id=user_id)
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    # Alapértelmezett oszlopok
    for title in ["Teendő", "Folyamatban", "Kész"]:
        create_column(db, schemas.ColumnCreate(title=title, board_id=db_board.id))
    create_activity_log(db, "board_created", db_board.id, user_id, f"Tábla létrehozva: {board.title}")
    db.refresh(db_board)
    return db_board

def delete_board(db: Session, board_id: int):
    db_board = get_board(db, board_id)
    if db_board:
        db.delete(db_board)
        db.commit()
        return True
    return False

def get_boards_by_user(db: Session, user_id: int):
    return db.query(models.Board).filter(models.Board.owner_id == user_id).all()

# --- COLUMN MŰVELETEK ---
def create_column(db: Session, column: schemas.ColumnCreate):
    db_column = models.BoardColumn(**column.model_dump())
    db.add(db_column)
    db.commit()
    db.refresh(db_column)
    return db_column

def update_column(db: Session, column_id: int, column_update: schemas.ColumnUpdate):
    db_column = db.query(models.BoardColumn).filter(models.BoardColumn.id == column_id).first()
    if db_column:
        for key, value in column_update.model_dump(exclude_unset=True).items():
            setattr(db_column, key, value)
        db.commit()
        db.refresh(db_column)
    return db_column

def delete_column(db: Session, column_id: int):
    db_column = db.query(models.BoardColumn).filter(models.BoardColumn.id == column_id).first()
    if db_column:
        db.delete(db_column)
        db.commit()
        return True
    return False

# --- CARD MŰVELETEK ---
def create_card(db: Session, card: schemas.CardCreate, user_id: int):
    db_card = models.Card(**card.model_dump(), creator_id=user_id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    # Keressük meg a tábla ID-t a naplózáshoz
    column = db.query(models.BoardColumn).filter(models.BoardColumn.id == card.column_id).first()
    if column:
        create_activity_log(db, "card_created", column.board_id, user_id, f"Kártya létrehozva: {card.title}")
    return db_card

def update_card(db: Session, card_id: int, card_update: schemas.CardUpdate, user_id: int):
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if db_card:
        old_column_id = db_card.column_id
        for key, value in card_update.model_dump(exclude_unset=True).items():
            setattr(db_card, key, value)
        db.commit()
        db.refresh(db_card)
        # Ha változott az oszlop, naplózzuk a mozgást
        if card_update.column_id and card_update.column_id != old_column_id:
            column = db.query(models.BoardColumn).filter(models.BoardColumn.id == db_card.column_id).first()
            if column:
                create_activity_log(db, "card_moved", column.board_id, user_id, f"Kártya áthelyezve: {db_card.title}")
        return db_card
    return None

def delete_card(db: Session, card_id: int, user_id: int):
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if db_card:
        column = db.query(models.BoardColumn).filter(models.BoardColumn.id == db_card.column_id).first()
        if column:
            create_activity_log(db, "card_deleted", column.board_id, user_id, f"Kártya törölve: {db_card.title}")
        db.delete(db_card)
        db.commit()
        return True
    return False
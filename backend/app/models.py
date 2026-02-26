from sqlalchemy import Column, Integer, String, ForeignKey, Table, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# N:M kapcsolat tábla: Felhasználók és Táblák (meghívott tagok)
board_members = Table(
    "board_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("board_id", Integer, ForeignKey("boards.id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    
    # Kapcsolatok
    owned_boards = relationship("Board", back_populates="owner")
    joined_boards = relationship("Board", secondary=board_members, back_populates="members")
    created_cards = relationship("Card", back_populates="creator")
    activities = relationship("ActivityLog", back_populates="user")

class Board(Base):
    __tablename__ = "boards"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))

    # Kapcsolatok
    owner = relationship("User", back_populates="owned_boards")
    members = relationship("User", secondary=board_members, back_populates="joined_boards")
    columns = relationship("BoardColumn", back_populates="board", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="board")

class BoardColumn(Base):
    __tablename__ = "board_columns"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    order = Column(Integer, default=0)
    board_id = Column(Integer, ForeignKey("boards.id"))

    # Kapcsolatok
    board = relationship("Board", back_populates="columns")
    cards = relationship("Card", back_populates="board_column", cascade="all, delete-orphan")

class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)
    column_id = Column(Integer, ForeignKey("board_columns.id"))
    creator_id = Column(Integer, ForeignKey("users.id"))

    # Kapcsolatok
    board_column = relationship("BoardColumn", back_populates="cards")
    creator = relationship("User", back_populates="created_cards")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    details = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    board_id = Column(Integer, ForeignKey("boards.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    # Kapcsolatok
    board = relationship("Board", back_populates="activities")
    user = relationship("User", back_populates="activities")
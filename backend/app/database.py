from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite adatbázis fájl helye
SQLALCHEMY_DATABASE_URL = "sqlite:///./syncboard.db"

# A check_same_thread=False csak SQLite esetén szükséges
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Munkafolyamat (Session) létrehozó
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ebből származtatjuk majd a modelljeinket
Base = declarative_base()

# Függőség az API végpontokhoz: megnyit egy kapcsolatot, majd a végén bezárja
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
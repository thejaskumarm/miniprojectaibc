"""
TrustTrace AI - Database Session & Engine Configuration
Supports:
- Local SQLite (default: sqlite:///./data/trusttrace.db)
- Supabase / PostgreSQL (via DATABASE_URL environment variable)
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.db_models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/trusttrace.db")

# SQLite connection arguments
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

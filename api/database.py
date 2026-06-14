import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Retrieve database URL, fallback to local SQLite for easier local setup/testing
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Use SQLite as fallback
    DATABASE_URL = "sqlite:///./career_recommender.db"
    print("WARNING: DATABASE_URL not found in environment. Falling back to local SQLite database.")
else:
    # If using postgresql, handle the driver prefix if needed (e.g., vercel postgres or neon)
    # SQLAlchemy requires postgresql:// instead of postgres://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure database engine
# For SQLite, we need connect_args={"check_same_thread": False}
engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    # Postgres configuration - ensure pool settings are optimized for serverless (avoid idle pool exhaustion)
    engine_args["pool_pre_ping"] = True
    engine_args["pool_recycle"] = 300

engine = create_engine(DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize tables
def init_db():
    Base.metadata.create_all(bind=engine)

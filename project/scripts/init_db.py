import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import your models so SQLAlchemy knows about them!
from app.db import models
from app.db.database import Base, engine

def init():
    print("Using DB:", engine.url)
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

if __name__ == "__main__":
    init()
from fastapi import APIRouter, Query
from app.services.embedding import get_embedding
from app.services.vector_store import SimpleVectorStore
from app.db import database, models
from sqlalchemy.orm import Session
from fastapi import Depends
from app.services.chunking import chunk_text

router = APIRouter()

# Initialize vector store (in-memory for demo)
vector_store = SimpleVectorStore(dim=384)  # 384 for MiniLM-L6-v2

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.on_event("startup")
def build_index():
    # vector_store.clear()  # Add this if your vector store supports it
    db = next(get_db())
    docs = db.query(models.Document).all()
    for doc in docs:
        if doc.content:
            chunks = chunk_text(doc.content, chunk_size=500)
            for chunk in chunks:
                emb = get_embedding(chunk)
                vector_store.add(emb, chunk)  # Store each chunk

@router.get("/search")
def word_search(
    word: str = Query(...),
    document_id: int = Query(...),  # Require document_id
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc or not doc.content:
        return {"error": "Document not found or empty."}
    chunks = chunk_text(doc.content, chunk_size=500)
    word_lower = word.lower()
    matches = [chunk for chunk in chunks if word_lower in chunk.lower()]
    total = len(matches)
    start = (page - 1) * page_size
    end = start + page_size
    paged_matches = matches[start:end]
    return {
        "word": word,
        "matches": paged_matches,
        "total": total,
        "page": page,
        "page_size": page_size
    }
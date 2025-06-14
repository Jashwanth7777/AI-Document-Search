from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import database, models
from app.services.pdf_parser import extract_text_from_pdf
import os
import shutil

router = APIRouter()

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if file.filename.lower().endswith(".pdf"):
        content = extract_text_from_pdf(file_location)
    elif file.filename.lower().endswith(".txt"):
        with open(file_location, "r", encoding="utf-8") as f:
            content = f.read()
    else:
        content = "[Unsupported file type for parsing]"

    # Store the whole content as one record (no chunking)
    doc = models.Document(
        filename=file.filename,
        filepath=file_location,
        content=content,
        owner_id=None
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {
        "filename": file.filename,
        "document_id": doc.id,
        "message": "File uploaded",  # <-- Changed here
        "content_preview": content[:200] if content else ""
    }
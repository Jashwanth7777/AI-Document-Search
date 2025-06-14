from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1 import auth, documents, search

app = FastAPI()

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])

app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/")
def read_root():
    return {"message": "AI Knowledge Base API is running"}
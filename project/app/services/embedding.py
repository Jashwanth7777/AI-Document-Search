import os
from sentence_transformers import SentenceTransformer



# Load the HuggingFace model once at startup
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str):
    return model.encode(text)
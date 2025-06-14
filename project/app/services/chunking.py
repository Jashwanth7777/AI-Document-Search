def chunk_text(text, chunk_size=500, overlap=0):
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap if overlap else chunk_size
    return chunks
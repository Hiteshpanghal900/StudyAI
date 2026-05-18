import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.rag import ask_question, process_pdf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)

    filepath = f"uploads/{file.filename}"

    with open(filepath, "wb") as f:
        f.write(await file.read())

    process_pdf(filepath)

    return {
        "message": "File uploaded successfully",
    }

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
async def chat(query: dict):
    answer = ask_question(query["question"])
    return {
        "answer": answer,
    }
import uuid
from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel

from app.rag import (
    ask_question,
    process_pdf,
    get_all_documents,
    delete_document,
    reset_documents_storage,
)
from app.core.logger import logger
from app.storage import UPLOADS_DIR, delete_uploaded_document

router = APIRouter()


@router.post("/reset-storage")
def reset_storage():
    try:
        reset_documents_storage()
        return {"message": "Document storage reset successfully"}
    except Exception as e:
        logger.error(f"Error resetting document storage: {e}")
        return {"error": str(e)}


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        # Generate a unique document ID
        document_id = str(uuid.uuid4())
        filename = f"{document_id}_{file.filename}"

        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        file_path = UPLOADS_DIR / filename
        
        # Save the uploaded file
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Process the PDF and store chunks in Chroma DB
        logger.info(f"Processing file '{filename}' with document_id: '{document_id}'")
        result = process_pdf(str(file_path), document_id, file.filename)

        if result.get("error"):
            raise RuntimeError(result["error"])

        logger.info(f"File '{filename}' uploaded and processed with document_id: '{document_id}'") 
        return {
            "message": "File uploaded and processed successfully",
            "document_id": document_id,
            "name": file.filename,
            "filename": filename,
            "url": f"http://127.0.0.1:8000/uploads/{filename}",
        }
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        return {"error": str(e)}
    

@router.get("/documents")
def documents():
    try:
        return get_all_documents()
    except Exception as e:
        logger.error(f"Error getting documents: {e}")
        return {"error": str(e)}


@router.delete("/documents/{document_id}")
def delete(document_id: str):
    try:
        delete_document(document_id)
        delete_uploaded_document(document_id)
        return {"message": f"Document with ID '{document_id}' deleted successfully"}
    except Exception as e:
        print(f"Error deleting document: {e}")
        return {"error": str(e)}


class ChatRequest(BaseModel):
    question: str
    document_id: str
    chat_history: list[dict[str, str]] = []

@router.post("/chat")
async def chat(request: ChatRequest):
    answer = ask_question(
        request.question,
        request.document_id,
        request.chat_history,
    )
    return {
        "answer": answer,
    }

@router.get("/")
def health():
    return {"message": "API is healthy"}

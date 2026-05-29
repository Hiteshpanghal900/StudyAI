import os
import gc
from dotenv import load_dotenv
import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_classic.chains import RetrievalQA

from app.core.logger import logger
from app.services.prompt import prompt
from app.storage import CHROMA_DB_DIR, reset_runtime_storage

load_dotenv()

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vector_store = None


def get_vector_store():
    global vector_store

    if vector_store is None:
        vector_store = Chroma(
            persist_directory=str(CHROMA_DB_DIR),
            embedding_function=embedding_model
        )

    return vector_store


def reset_documents_storage():
    global vector_store

    vector_store = None
    gc.collect()
    reset_runtime_storage()

llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.1-8b-instant",
    max_tokens=300,
    temperature=0.2
)

def extract_text_from_pdf(filepath):
    """Extract text from a PDF file using PyMuPDF (fitz)"""
    doc = fitz.open(filepath)

    text = ""
    for page in doc:
        text += page.get_text()
    
    return text


def process_pdf(filepath, document_id, original_filename=None):
    """
    Process the PDF file by extracting text and splitting it into chunks.
    Then store it into Chroma DB for later retrieval.
    """
    try:
        text = extract_text_from_pdf(filepath)

        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=200)
        chunks = splitter.split_text(text)

        # Add texts with document_id and filename as metadata to track which chunks belong to this document
        filename = os.path.basename(filepath)
        display_name = original_filename or filename
        ids = [f"{document_id}_{i}" for i in range(len(chunks))]
        get_vector_store().add_texts(
            chunks,
            ids=ids,
            metadatas=[
                {
                    "document_id": document_id,
                    "filename": filename,
                    "display_name": display_name,
                }
                for _ in chunks
            ]
        )

        return {"message": f"Processed PDF and stored {len(chunks)} chunks in Chroma DB with document_id: '{document_id}'"}
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return {"error": str(e)}


def format_chat_history(chat_history):
    recent_messages = chat_history[-10:]
    formatted_messages = []

    for message in recent_messages:
        role = message.get("role")
        content = message.get("content", "").strip()

        if role not in {"user", "assistant"} or not content:
            continue

        label = "User" if role == "user" else "Assistant"
        formatted_messages.append(f"{label}: {content[:700]}")

    if not formatted_messages:
        return ""

    return "\n".join(formatted_messages)


def ask_question(question, document_id, chat_history=None):
    """
    Retrieve relevant chunks from Chroma DB based on the question and document_id.
    Only searches within chunks from the specified document.
    """
    try:
        chat_context = format_chat_history(chat_history or [])
        contextual_question = question

        if chat_context:
            contextual_question = (
                "Recent conversation for context only:\n"
                f"{chat_context}\n\n"
                "Current question to answer:\n"
                f"{question}"
            )

        # Create filtered retriever instance using native Chroma metadata filtering
        filtered_retriever = get_vector_store().as_retriever(
            search_kwargs={
                "filter": {"document_id": document_id},
                "k": 5
            }
        )
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=filtered_retriever,
            chain_type_kwargs={"prompt": prompt},
            chain_type="stuff"
        )
        
        results = qa_chain.run(contextual_question)
        return results
    except Exception as e:
        print(f"Error in ask_question: {e}")
        return f"Error: {str(e)}"


def get_all_documents():
    """Retrieve all unique documents currently stored in Chroma DB."""
    try:
        if not any(CHROMA_DB_DIR.iterdir()):
            return []

        data = get_vector_store().get()
        metadatas = data.get("metadatas", [])
        
        unique_docs = {}
        for m in metadatas:
            if m and "document_id" in m:
                doc_id = m["document_id"]
                if doc_id not in unique_docs:
                    filename = m.get("filename", "Untitled Document")
                    unique_docs[doc_id] = {
                        "filename": filename,
                        "display_name": m.get("display_name", filename),
                    }
        
        # Format as list of dicts suitable for sidebar (including URL for PDF preview)
        return [
            {
                "id": doc_id,
                "document_id": doc_id,
                "name": document["display_name"],
                "filename": document["filename"],
                "url": f"http://127.0.0.1:8000/uploads/{document['filename']}"
            }
            for doc_id, document in unique_docs.items()
        ]
    except Exception as e:
        print(f"Error getting documents from Chroma: {e}")
        return []


def delete_document(document_id):
    """Delete all chunks belonging to a specific document_id from Chroma DB."""
    try:
        if not any(CHROMA_DB_DIR.iterdir()):
            return False

        data = get_vector_store().get(where={"document_id": document_id})
        ids = data.get("ids", [])

        if ids:
            get_vector_store().delete(ids=ids)
            logger.debug(f"Deleted {len(ids)} chunks for document_id: '{document_id}'")
            return True
        
        logger.warning(f"[DEBUG] No chunks found for document_id: '{document_id}'")
        return False
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        return False

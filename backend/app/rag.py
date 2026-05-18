import os
from dotenv import load_dotenv
import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_classic.chains import RetrievalQA

load_dotenv()

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vector_store = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embedding_model
)

llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.1-8b-instant"
)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vector_store.as_retriever()
)

def extract_text_from_pdf(filepath):
    """Extract text from a PDF file using PyMuPDF (fitz)"""
    doc = fitz.open(filepath)

    text = ""
    for page in doc:
        text += page.get_text()
    
    return text


def process_pdf(filepath):
    """
    Process the PDF file by extracting text and splitting it into chunks.
    Then store it into Chroma DB for later retrieval.
    """
    text = extract_text_from_pdf(filepath)

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=200)
    chunks = splitter.split_text(text)

    vector_store.add_texts(chunks)

    for i, chunk in enumerate(chunks):
        print(f"Chunk {i+1}:\n{chunk}\n")


def ask_question(question):
    """
    Retrieve relevant chunks from Chroma DB based on the question and return them.
    """
    results = qa_chain.run(question)
    return results
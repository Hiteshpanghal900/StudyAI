# StudyAI

StudyAI is a full-stack RAG application for uploading PDF documents, previewing them in the browser, and asking document-grounded questions through a modern chat interface. It combines a FastAPI backend, LangChain retrieval pipeline, ChromaDB vector storage, Hugging Face embeddings, Groq-hosted LLM responses, and a responsive Next.js frontend.

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-RAG-1C3C3C?style=flat-square)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-6D5DFB?style=flat-square)
![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=flat-square)
![Hugging Face](https://img.shields.io/badge/Hugging_Face-Embeddings-FFD21E?style=flat-square&logo=huggingface&logoColor=111)

## Features

- Upload PDF documents and index them into a local ChromaDB vector store.
- Preview uploaded PDFs directly inside the application.
- Ask questions against the selected document using a Retrieval-Augmented Generation pipeline.
- Preserve a short chat context window for follow-up questions.
- Render assistant responses as lightweight Markdown.
- Keep responses concise using prompt rules and model token limits.
- Switch between dark and light themes.
- Delete documents from both the vector store and upload storage.
- Reset runtime document storage on backend restart.

## Architecture

StudyAI follows a simple client-server architecture:

1. The frontend sends uploaded PDFs to the FastAPI backend.
2. The backend extracts PDF text with PyMuPDF.
3. Text is split into chunks with LangChain text splitters.
4. Chunks are embedded using Hugging Face sentence-transformer embeddings.
5. Embeddings and metadata are persisted in ChromaDB.
6. User questions are filtered by selected `document_id`.
7. Retrieved context, recent chat history, and the current question are passed to the Groq LLM.
8. The frontend renders the response in the chat panel.

## Folder Structure

```text
StudyAI/
|-- backend/
|   |-- app/
|   |   |-- core/
|   |   |   `-- logger.py
|   |   |-- services/
|   |   |   `-- prompt.py
|   |   |-- main.py
|   |   |-- rag.py
|   |   |-- route.py
|   |   `-- storage.py
|   |-- chroma_db/
|   |-- uploads/
|   |-- .env
|   `-- requirements.txt
|-- frontend/
|   |-- app/
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |   |-- ChatArea.tsx
|   |   |-- Header.tsx
|   |   |-- PDFViewer.tsx
|   |   |-- Sidebar.tsx
|   |   `-- UploadModal.tsx
|   |-- lib/
|   |   `-- api.ts
|   |-- public/
|   |-- .env.local
|   `-- package.json
|-- start.bat
`-- README.md
```

## Backend Overview

The backend is built with FastAPI and exposes routes for document upload, listing, deletion, chat, and health checks.

Key files:

- `backend/app/main.py`: FastAPI app setup, CORS configuration, static upload serving, and startup storage reset.
- `backend/app/route.py`: API routes for upload, documents, delete, chat, and storage reset.
- `backend/app/rag.py`: PDF extraction, chunking, embedding, retrieval, and LLM question answering.
- `backend/app/storage.py`: Local runtime storage helpers for uploads and ChromaDB.
- `backend/app/services/prompt.py`: Prompt template controlling answer quality, markdown style, precision, and length.

### API Routes

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/` | Backend health check |
| `POST` | `/upload` | Upload and index a PDF |
| `GET` | `/documents` | Return indexed document metadata |
| `DELETE` | `/documents/{document_id}` | Delete document embeddings and uploaded PDF |
| `POST` | `/chat` | Ask a question about a selected document |
| `POST` | `/reset-storage` | Clear runtime uploads and vector database |
| `GET` | `/uploads/{filename}` | Serve uploaded PDF files for preview |

## Frontend Overview

The frontend is a Next.js application with a responsive document workspace.

Key files:

- `frontend/app/page.tsx`: Main app state, layout, document list loading, theme switching, and selected document handling.
- `frontend/components/Sidebar.tsx`: Document library, upload trigger, and delete controls.
- `frontend/components/UploadModal.tsx`: Drag-and-drop PDF upload modal.
- `frontend/components/PDFViewer.tsx`: Browser PDF preview using `react-pdf`.
- `frontend/components/ChatArea.tsx`: Chat interface, markdown answer rendering, and recent chat history forwarding.
- `frontend/lib/api.ts`: Backend API URL helper.

## Environment Variables

Create a backend `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
```

Create a frontend `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Installation

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

## Quick Start

From the project root on Windows, you can also run:

```bash
start.bat
```

This starts the backend and frontend in separate command windows.

## Runtime Storage

StudyAI uses local runtime folders:

- `backend/uploads`: stores uploaded PDFs.
- `backend/chroma_db`: stores ChromaDB vector data.

The backend currently clears both folders on application restart. Browser reloads do not clear storage; the frontend reloads available documents from `GET /documents`.

## Retrieval And Answering Behavior

- Retrieval is scoped to the selected `document_id`.
- The assistant receives the last few chat turns for short follow-up context.
- Answers are intentionally concise.
- Direct questions receive direct answers.
- Explanation questions may include a short example when helpful.
- Responses can include Markdown formatting for readability.
- The model is instructed not to invent unsupported document-specific facts.

## Development Commands

### Frontend

```bash
npm run dev
npm run build
npm run lint
```

### Backend

```bash
uvicorn app.main:app --reload --port 8000
python -m py_compile app/main.py app/route.py app/rag.py app/storage.py app/services/prompt.py
```

## Notes

- Uploaded files and vector data are local runtime artifacts and should not be committed.
- The application expects PDF files for upload.
- ChromaDB is initialized lazily when documents are indexed or queried.
- The LLM output is capped with a token limit to keep answers focused.

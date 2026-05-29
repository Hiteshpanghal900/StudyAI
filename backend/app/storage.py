import shutil
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
UPLOADS_DIR = BACKEND_ROOT / "uploads"
CHROMA_DB_DIR = BACKEND_ROOT / "chroma_db"


def empty_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)

    for item in path.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()


def reset_runtime_storage() -> None:
    empty_directory(UPLOADS_DIR)
    empty_directory(CHROMA_DB_DIR)


def delete_uploaded_document(document_id: str) -> None:
    if not UPLOADS_DIR.exists():
        return

    for file_path in UPLOADS_DIR.glob(f"{document_id}_*"):
        if file_path.is_file():
            file_path.unlink()

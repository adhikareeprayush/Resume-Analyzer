from __future__ import annotations

import re
from pathlib import Path

import PyPDF2
import docx2txt

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def clean_text(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"\W+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_text_pdf(file_path: Path) -> str:
    text = []
    with file_path.open("rb") as file_handle:
        reader = PyPDF2.PdfReader(file_handle)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
    return "\n".join(text)


def extract_text_docx(file_path: Path) -> str:
    return docx2txt.process(str(file_path)) or ""


def extract_text_txt(file_path: Path) -> str:
    with file_path.open("r", encoding="utf-8", errors="ignore") as file_handle:
        return file_handle.read()


def extract_text(file_path: Path) -> str:
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        return extract_text_pdf(file_path)
    if suffix == ".docx":
        return extract_text_docx(file_path)
    if suffix == ".txt":
        return extract_text_txt(file_path)
    return ""

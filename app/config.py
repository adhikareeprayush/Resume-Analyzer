import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://talentlens:talentlens@localhost:5433/talentlens",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_EXPIRE_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "168"))

    UPLOAD_FOLDER = BASE_DIR / "uploads"
    INSTANCE_FOLDER = BASE_DIR / "instance"
    ANALYSIS_FOLDER = INSTANCE_FOLDER / "analyses"
    MODEL_PATH = BASE_DIR / "models" / "resume-fit-final"
    FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

    MAX_RESUMES = int(os.environ.get("MAX_RESUMES", "150"))
    MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "100"))
    ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5001",
    ).split(",")

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

import PyPDF2
import docx2txt
from flask import Flask, abort, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from skill_keywords import extract_job_keywords, keyword_matches_resume, match_keywords_for_resume


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
INSTANCE_FOLDER = BASE_DIR / "instance"
ANALYSIS_FOLDER = INSTANCE_FOLDER / "analyses"
HISTORY_FILE = INSTANCE_FOLDER / "analysis_history.json"
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
MODEL_PATH = BASE_DIR / "models" / "resume-fit-final"
FIT_LABELS = {0: "No Fit", 1: "Potential Fit", 2: "Good Fit"}
FIT_SCORE_WEIGHTS = (38, 72, 92)
FIT_TIERS = [
    {"label": "Good Fit", "scoreRange": "85%+", "minScore": 85, "maxScore": 99},
    {"label": "Potential Fit", "scoreRange": "75–84%", "minScore": 75, "maxScore": 84},
    {"label": "No Fit", "scoreRange": "Below 75%", "minScore": 0, "maxScore": 74},
]
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_RESUMES = int(os.environ.get("MAX_RESUMES", "150"))
MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "100"))

_tokenizer = None
_model = None


app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024


def ensure_storage() -> None:
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    INSTANCE_FOLDER.mkdir(parents=True, exist_ok=True)
    ANALYSIS_FOLDER.mkdir(parents=True, exist_ok=True)
    if not HISTORY_FILE.exists():
        HISTORY_FILE.write_text("[]", encoding="utf-8")


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
    extracted = docx2txt.process(str(file_path))
    return extracted or ""


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


def load_json_file(path: Path, fallback):
    try:
        if not path.exists():
            return fallback
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback


def save_json_file(path: Path, payload) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def get_analysis_history(limit: int = 10) -> list[dict]:
    history = load_json_file(HISTORY_FILE, [])
    if not isinstance(history, list):
        return []
    return history[:limit]


def append_analysis_history(entry: dict) -> list[dict]:
    current = get_analysis_history(limit=50)
    next_history = [entry, *current][:50]
    save_json_file(HISTORY_FILE, next_history)
    return next_history


def get_fit_model():
    global _tokenizer, _model
    if _model is None:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        if not MODEL_PATH.is_dir():
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

        _tokenizer = AutoTokenizer.from_pretrained(str(MODEL_PATH))
        _model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_PATH))
        _model.eval()
    return _tokenizer, _model


def predict_resume_fit(resume_text: str, job_description: str) -> dict:
    import torch

    tokenizer, model = get_fit_model()
    resume = (resume_text or "").strip() or " "
    job = (job_description or "").strip() or " "

    inputs = tokenizer(resume, job, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=-1)[0]

    pred_idx = int(probs.argmax().item())
    score = max(0, min(99, round(sum(probs[i].item() * FIT_SCORE_WEIGHTS[i] for i in range(3)))))
    confidence = max(0, min(99, round(float(probs[pred_idx]) * 100)))

    return {
        "fitLabel": FIT_LABELS[pred_idx],
        "fitClass": pred_idx,
        "probabilities": {
            "noFit": round(probs[0].item(), 4),
            "potentialFit": round(probs[1].item(), 4),
            "goodFit": round(probs[2].item(), 4),
        },
        "score": score,
        "confidence": confidence,
    }


def score_analysis(job_description: str, resume_texts: list[str], resume_names: list[str]) -> dict:
    keywords = extract_job_keywords(job_description)

    matched_keywords_overall: list[str] = []
    missing_keywords_overall: list[str] = []
    for keyword in keywords:
        if any(keyword_matches_resume(keyword, resume_text) for resume_text in resume_texts):
            matched_keywords_overall.append(keyword)
        else:
            missing_keywords_overall.append(keyword)

    ranked_resumes: list[dict] = []
    for index, name in enumerate(resume_names):
        raw_text = resume_texts[index]
        matched_keywords, missing_keywords = match_keywords_for_resume(keywords, raw_text)
        keyword_coverage = len(matched_keywords) / len(keywords) if keywords else 0

        prediction = predict_resume_fit(raw_text, job_description)
        score = prediction["score"]
        confidence = prediction["confidence"]
        fit_label = prediction["fitLabel"]
        skills_matched = max(1, min(8, len(matched_keywords) or round(score / 14) or 1))
        gap_risk = max(5, 100 - score)
        explanation = (
            f"Model prediction: {fit_label}. "
            f"Matched {len(matched_keywords)} of {len(keywords)} role skills/keywords."
            if keywords
            else f"Model prediction: {fit_label}."
        )

        ranked_resumes.append(
            {
                "id": f"{name}-{index}",
                "resumeName": name,
                "score": score,
                "confidence": confidence,
                "fitLabel": fit_label,
                "fitClass": prediction["fitClass"],
                "probabilities": prediction["probabilities"],
                "skillsMatched": skills_matched,
                "gapRisk": gap_risk,
                "keywordCoverage": round(keyword_coverage * 100),
                "matchedKeywords": matched_keywords,
                "missingKeywords": missing_keywords,
                "explanation": explanation,
                "recommendation": (
                    "Strong shortlist profile based on role alignment."
                    if fit_label == "Good Fit"
                    else "Promising profile with a few role-specific gaps."
                    if fit_label == "Potential Fit"
                    else "Requires deeper review for fit and technical readiness."
                ),
            }
        )

    ranked_resumes.sort(key=lambda item: item["score"], reverse=True)

    summary = {
        "totalResumes": len(ranked_resumes),
        "avgScore": round(sum(item["score"] for item in ranked_resumes) / len(ranked_resumes))
        if ranked_resumes
        else 0,
        "topScore": ranked_resumes[0]["score"] if ranked_resumes else 0,
        "keywordInsights": {
            "totalKeywords": len(keywords),
            "matchedKeywordsCount": len(matched_keywords_overall),
            "missingKeywordsCount": len(missing_keywords_overall),
            "coverageRate": round((len(matched_keywords_overall) / len(keywords)) * 100) if keywords else 0,
        },
        "distribution": {
            "high": sum(1 for item in ranked_resumes if item["score"] >= 85),
            "medium": sum(1 for item in ranked_resumes if 75 <= item["score"] < 85),
            "low": sum(1 for item in ranked_resumes if item["score"] < 75),
        },
        "fitTiers": FIT_TIERS,
    }

    return {
        "keywords": keywords,
        "matchedKeywords": matched_keywords_overall,
        "missingKeywords": missing_keywords_overall,
        "rankedResumes": ranked_resumes,
        "summary": summary,
    }


@app.get("/api/health")
def api_health():
    model_ready = MODEL_PATH.is_dir()
    return jsonify(
        {
            "status": "ok",
            "service": "resume-analyzer",
            "version": "1.0.0",
            "modelPath": str(MODEL_PATH),
            "modelReady": model_ready,
            "maxResumes": MAX_RESUMES,
            "time": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.get("/api/analysis-history")
def api_analysis_history():
    limit = request.args.get("limit", default=10, type=int)
    return jsonify({"history": get_analysis_history(limit=max(1, min(limit, 50)))})


@app.get("/api/analysis/<analysis_id>")
def api_analysis_detail(analysis_id: str):
    record_path = ANALYSIS_FOLDER / f"{analysis_id}.json"
    if not record_path.exists():
        return jsonify({"error": "Analysis not found"}), 404
    return jsonify(load_json_file(record_path, {}))


@app.post("/api/analyze")
def api_analyze():
    job_title = (request.form.get("jobTitle") or request.form.get("job_title") or "Untitled Role").strip()
    job_description = (
        request.form.get("jobDescription")
        or request.form.get("resumeText")
        or request.form.get("job_description")
        or ""
    ).strip()
    resume_files = request.files.getlist("resumeFile")

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400
    if not resume_files:
        return jsonify({"error": "Upload at least one resume file"}), 400
    if len(resume_files) > MAX_RESUMES:
        return jsonify({"error": f"Upload up to {MAX_RESUMES} resumes at a time"}), 400

    analysis_id = uuid.uuid4().hex[:12]
    analysis_upload_dir = UPLOAD_FOLDER / analysis_id
    analysis_upload_dir.mkdir(parents=True, exist_ok=True)

    extracted_texts: list[str] = []
    stored_files: list[dict] = []
    invalid_files: list[str] = []

    for uploaded_file in resume_files:
        if not uploaded_file or not uploaded_file.filename:
            continue

        if not allowed_file(uploaded_file.filename):
            invalid_files.append(uploaded_file.filename)
            continue

        safe_name = secure_filename(uploaded_file.filename)
        file_path = analysis_upload_dir / safe_name
        uploaded_file.save(file_path)

        extracted_text = extract_text(file_path)
        extracted_texts.append(extracted_text)
        stored_files.append(
            {
                "name": safe_name,
                "size": file_path.stat().st_size,
                "type": file_path.suffix.lower().lstrip("."),
            }
        )

    if invalid_files and not stored_files:
        return jsonify({"error": "Only PDF, DOCX, and TXT files are allowed", "invalidFiles": invalid_files}), 400
    if not stored_files:
        return jsonify({"error": "No valid resumes were uploaded"}), 400

    analysis = score_analysis(job_description, extracted_texts, [item["name"] for item in stored_files])
    processed_at = datetime.now(timezone.utc).isoformat()

    response_payload = {
        "analysisId": analysis_id,
        "jobTitle": job_title,
        "jobDescription": job_description,
        "uploadedFiles": stored_files,
        "invalidFiles": invalid_files,
        "processedAt": processed_at,
        **analysis,
    }

    save_json_file(ANALYSIS_FOLDER / f"{analysis_id}.json", response_payload)

    history_entry = {
        "analysisId": analysis_id,
        "jobTitle": job_title,
        "processedAt": processed_at,
        "totalResumes": analysis["summary"]["totalResumes"],
        "avgScore": analysis["summary"]["avgScore"],
        "topScore": analysis["summary"]["topScore"],
    }
    history = append_analysis_history(history_entry)

    response_payload["history"] = history
    return jsonify(response_payload)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    if path.startswith("api/"):
        abort(404)

    if FRONTEND_DIST.exists():
        requested_file = FRONTEND_DIST / path
        if path and requested_file.exists() and requested_file.is_file():
            return send_from_directory(FRONTEND_DIST, path)

        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return send_from_directory(FRONTEND_DIST, "index.html")

    return jsonify(
        {
            "service": "resume-analyzer",
            "message": "Build the React frontend or call the /api endpoints directly.",
        }
    )


ensure_storage()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5001"))
    app.run(debug=True, port=port)
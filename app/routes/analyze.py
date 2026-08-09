from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.utils import secure_filename

from app.auth_utils import company_required
from app.extensions import db
from app.models import AnalysisRecord
from app.services.analysis import score_analysis
from app.services.text_extraction import allowed_file, extract_text

analyze_bp = Blueprint("analyze", __name__, url_prefix="/api")


@analyze_bp.get("/health")
def health():
    model_path = Path(current_app.config["MODEL_PATH"])
    return jsonify(
        {
            "status": "ok",
            "service": "talentlens-atlas",
            "version": "2.0.0",
            "modelPath": str(model_path),
            "modelReady": model_path.is_dir(),
            "maxResumes": current_app.config["MAX_RESUMES"],
            "time": datetime.now(timezone.utc).isoformat(),
        }
    )


@analyze_bp.get("/analysis-history")
@company_required
def analysis_history():
    limit = request.args.get("limit", default=10, type=int)
    limit = max(1, min(limit, 50))
    records = (
        AnalysisRecord.query.filter_by(company_id=g.current_company_id)
        .order_by(AnalysisRecord.processed_at.desc())
        .limit(limit)
        .all()
    )
    return jsonify({"history": [record.to_history_item() for record in records]})


@analyze_bp.get("/analysis/<analysis_id>")
@company_required
def analysis_detail(analysis_id: str):
    record = AnalysisRecord.query.filter_by(id=analysis_id, company_id=g.current_company_id).first()
    if not record:
        return jsonify({"error": "Analysis not found"}), 404
    return jsonify(record.payload)


@analyze_bp.post("/analyze")
@company_required
def analyze():
    user = g.current_user
    company_id = g.current_company_id

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
    if len(resume_files) > current_app.config["MAX_RESUMES"]:
        return jsonify({"error": f"Upload up to {current_app.config['MAX_RESUMES']} resumes at a time"}), 400

    analysis_id = uuid.uuid4().hex[:12]
    upload_root = Path(current_app.config["UPLOAD_FOLDER"])
    analysis_upload_dir = upload_root / analysis_id
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

    try:
        analysis = score_analysis(
            job_description,
            extracted_texts,
            [item["name"] for item in stored_files],
            Path(current_app.config["MODEL_PATH"]),
        )
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 503

    processed_at = datetime.now(timezone.utc)

    response_payload = {
        "analysisId": analysis_id,
        "jobTitle": job_title,
        "jobDescription": job_description,
        "uploadedFiles": stored_files,
        "invalidFiles": invalid_files,
        "processedAt": processed_at.isoformat(),
        **analysis,
    }

    record = AnalysisRecord(
        id=analysis_id,
        company_id=company_id,
        user_id=user.id,
        job_title=job_title,
        job_description=job_description,
        payload=response_payload,
        processed_at=processed_at,
    )
    db.session.add(record)
    db.session.commit()

    history = (
        AnalysisRecord.query.filter_by(company_id=company_id)
        .order_by(AnalysisRecord.processed_at.desc())
        .limit(50)
        .all()
    )
    response_payload["history"] = [item.to_history_item() for item in history]

    return jsonify(response_payload)

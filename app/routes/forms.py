from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.utils import secure_filename

from app.auth_utils import company_required, optional_user
from app.extensions import db
from app.models import AnalysisRecord, ApplicationForm, Job, Submission
from app.seed import create_id, slugify
from app.services.analysis import score_analysis
from app.services.text_extraction import allowed_file, extract_text

forms_bp = Blueprint("forms", __name__, url_prefix="/api/forms")


def _answers_as_text(form: ApplicationForm, answers: dict) -> str:
    parts: list[str] = []
    for field in form.fields or []:
        field_id = field.get("id")
        label = field.get("label") or field_id
        value = (answers or {}).get(field_id)
        if value is None or value == "" or value is False:
            continue
        if field.get("type") == "file":
            if isinstance(value, dict):
                name = value.get("name") or value.get("filename")
                if name:
                    parts.append(f"{label}: {name}")
            elif isinstance(value, str):
                parts.append(f"{label}: {value}")
            continue
        if field.get("type") == "checkbox":
            parts.append(f"{label}: yes")
            continue
        parts.append(f"{label}: {value}")
    return "\n".join(parts)


def _submission_resume_text(form: ApplicationForm, submission: Submission, upload_root: Path) -> str:
    if submission.resume_path:
        file_path = upload_root / submission.resume_path
        if file_path.is_file():
            text = extract_text(file_path).strip()
            if text:
                return text

    fallback = _answers_as_text(form, submission.answers or {})
    header = f"Candidate: {submission.candidate_name}\nEmail: {submission.email}"
    return f"{header}\n{fallback}".strip()


def _parse_submit_payload():
    """Support JSON and multipart application submits."""
    if request.content_type and "multipart/form-data" in request.content_type:
        answers_raw = request.form.get("answers") or "{}"
        try:
            answers = json.loads(answers_raw)
        except json.JSONDecodeError:
            answers = {}
        return {
            "candidateName": (request.form.get("candidateName") or "Candidate").strip(),
            "email": (request.form.get("email") or "unknown@email.com").strip(),
            "id": request.form.get("id"),
            "answers": answers if isinstance(answers, dict) else {},
            "files": request.files,
        }

    data = request.get_json(silent=True) or {}
    return {
        "candidateName": (data.get("candidateName") or "Candidate").strip(),
        "email": (data.get("email") or "unknown@email.com").strip(),
        "id": data.get("id"),
        "answers": data.get("answers") or {},
        "files": None,
    }


@forms_bp.get("/public/<slug>")
def get_public_form(slug: str):
    form = ApplicationForm.query.filter_by(slug=slug, is_published=True).first()
    if not form:
        return jsonify({"error": "Application form not found"}), 404

    job = Job.query.get(form.job_id)
    return jsonify(
        {
            "form": form.to_dict(),
            "job": job.to_dict() if job else None,
        }
    )


@forms_bp.post("/public/<slug>/submit")
def submit_public_form(slug: str):
    form = ApplicationForm.query.filter_by(slug=slug, is_published=True).first()
    if not form:
        return jsonify({"error": "Application form not found"}), 404

    payload = _parse_submit_payload()
    answers = dict(payload["answers"] or {})
    files = payload["files"]

    submission_id = payload.get("id") or create_id("sub")
    resume_path = None
    resume_filename = None
    upload_root = Path(current_app.config["UPLOAD_FOLDER"])
    submission_dir = upload_root / "submissions" / submission_id
    file_fields = [field for field in (form.fields or []) if field.get("type") == "file"]

    for field in file_fields:
        field_id = field.get("id")
        uploaded = files.get(f"file_{field_id}") if files else None
        if uploaded and uploaded.filename:
            if not allowed_file(uploaded.filename):
                return jsonify({"error": f"Invalid file for {field.get('label')}. Use PDF, DOCX, or TXT."}), 400
            submission_dir.mkdir(parents=True, exist_ok=True)
            safe_name = secure_filename(uploaded.filename)
            stored = submission_dir / safe_name
            uploaded.save(stored)
            relative = str(Path("submissions") / submission_id / safe_name)
            answers[field_id] = safe_name
            if resume_path is None:
                resume_path = relative
                resume_filename = safe_name
        elif field.get("required") and not answers.get(field_id):
            return jsonify({"error": f"Missing required field: {field.get('label')}"}), 400
        elif isinstance(answers.get(field_id), str) and answers.get(field_id) and resume_filename is None:
            resume_filename = answers[field_id]

    for field in form.fields or []:
        if field.get("type") == "file":
            continue
        if field.get("required") and not answers.get(field.get("id")):
            return jsonify({"error": f"Missing required field: {field.get('label')}"}), 400

    applicant = optional_user()
    applicant_id = None
    if applicant and applicant.is_candidate:
        applicant_id = applicant.id
        if not payload["candidateName"] or payload["candidateName"] == "Candidate":
            payload["candidateName"] = applicant.name
        if not payload["email"] or payload["email"] == "unknown@email.com":
            payload["email"] = applicant.email

    submission = Submission(
        id=submission_id,
        form_id=form.id,
        job_id=form.job_id,
        company_id=form.company_id,
        candidate_name=payload["candidateName"],
        email=payload["email"],
        answers=answers,
        resume_path=resume_path,
        resume_filename=resume_filename,
        status="new",
        user_id=applicant_id,
    )
    db.session.add(submission)
    db.session.commit()
    return jsonify(submission.to_dict()), 201


@forms_bp.get("/<form_id>")
@company_required
def get_form(form_id: str):
    form = ApplicationForm.query.filter_by(id=form_id, company_id=g.current_company_id).first()
    if not form:
        return jsonify({"error": "Form not found"}), 404
    return jsonify(form.to_dict())


@forms_bp.post("")
@company_required
def create_form():
    data = request.get_json(silent=True) or {}
    job_id = data.get("jobId")
    if not job_id:
        return jsonify({"error": "jobId is required"}), 400

    job = Job.query.filter_by(id=job_id, company_id=g.current_company_id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    title = (data.get("title") or f"{job.title} Application").strip()
    slug = slugify(data.get("slug") or title)

    if ApplicationForm.query.filter_by(slug=slug).first():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    form = ApplicationForm(
        id=data.get("id") or create_id("form"),
        job_id=job.id,
        company_id=g.current_company_id,
        title=title,
        slug=slug,
        is_published=bool(data.get("isPublished")),
        fields=data.get("fields") or [],
        fjorm_data=data.get("fjormData"),
    )
    db.session.add(form)
    db.session.commit()
    return jsonify(form.to_dict()), 201


@forms_bp.put("/<form_id>")
@company_required
def update_form(form_id: str):
    form = ApplicationForm.query.filter_by(id=form_id, company_id=g.current_company_id).first()
    if not form:
        return jsonify({"error": "Form not found"}), 404

    data = request.get_json(silent=True) or {}
    if "title" in data:
        form.title = (data["title"] or form.title).strip()
    if "slug" in data:
        next_slug = slugify(data["slug"])
        existing = ApplicationForm.query.filter(
            ApplicationForm.slug == next_slug, ApplicationForm.id != form.id
        ).first()
        form.slug = next_slug if not existing else f"{next_slug}-{uuid.uuid4().hex[:6]}"
    if "isPublished" in data:
        form.is_published = bool(data["isPublished"])
    if "fields" in data:
        form.fields = data["fields"] or []
    if "fjormData" in data:
        form.fjorm_data = data["fjormData"]

    db.session.commit()
    return jsonify(form.to_dict())


@forms_bp.delete("/<form_id>")
@company_required
def delete_form(form_id: str):
    form = ApplicationForm.query.filter_by(id=form_id, company_id=g.current_company_id).first()
    if not form:
        return jsonify({"error": "Form not found"}), 404

    Submission.query.filter_by(form_id=form.id, company_id=g.current_company_id).delete()
    db.session.delete(form)
    db.session.commit()
    return jsonify({"ok": True})


@forms_bp.get("/<form_id>/analysis")
@company_required
def get_form_analysis(form_id: str):
    form = ApplicationForm.query.filter_by(id=form_id, company_id=g.current_company_id).first()
    if not form:
        return jsonify({"error": "Form not found"}), 404

    record = (
        AnalysisRecord.query.filter_by(form_id=form.id, company_id=g.current_company_id)
        .order_by(AnalysisRecord.processed_at.desc())
        .first()
    )
    if not record:
        return jsonify({"analysis": None})
    return jsonify({"analysis": record.payload})


@forms_bp.post("/<form_id>/analyze")
@company_required
def analyze_form_submissions(form_id: str):
    form = ApplicationForm.query.filter_by(id=form_id, company_id=g.current_company_id).first()
    if not form:
        return jsonify({"error": "Form not found"}), 404

    job = Job.query.filter_by(id=form.job_id, company_id=g.current_company_id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    job_description = (job.description or "").strip()
    if job.must_have:
        skills = ", ".join(job.must_have)
        job_description = f"{job_description}\n\nMust-have skills: {skills}".strip()
    if not job_description:
        return jsonify({"error": "Add a job description before ranking applicants."}), 400

    submissions = (
        Submission.query.filter_by(form_id=form.id, company_id=g.current_company_id)
        .order_by(Submission.submitted_at.asc())
        .all()
    )
    if not submissions:
        return jsonify({"error": "No submissions to analyze yet."}), 400

    upload_root = Path(current_app.config["UPLOAD_FOLDER"])
    resume_texts: list[str] = []
    resume_names: list[str] = []
    resume_ids: list[str] = []

    for submission in submissions:
        text = _submission_resume_text(form, submission, upload_root)
        if not text.strip():
            text = f"{submission.candidate_name}\n{submission.email}"
        resume_texts.append(text)
        resume_names.append(submission.candidate_name)
        resume_ids.append(submission.id)

    try:
        analysis = score_analysis(
            job_description,
            resume_texts,
            resume_names,
            Path(current_app.config["MODEL_PATH"]),
            resume_ids=resume_ids,
        )
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 503

    analysis_id = uuid.uuid4().hex[:12]
    processed_at = datetime.now(timezone.utc)
    response_payload = {
        "analysisId": analysis_id,
        "jobId": job.id,
        "formId": form.id,
        "jobTitle": job.title,
        "jobDescription": job_description,
        "processedAt": processed_at.isoformat(),
        "source": "form-submissions",
        **analysis,
    }

    # Enrich ranked rows with candidate contact from submissions.
    by_id = {item.id: item for item in submissions}
    for row in response_payload.get("rankedResumes") or []:
        sub = by_id.get(row.get("submissionId"))
        if sub:
            row["candidateName"] = sub.candidate_name
            row["email"] = sub.email
            row["resumeFilename"] = sub.resume_filename

    record = AnalysisRecord(
        id=analysis_id,
        company_id=g.current_company_id,
        user_id=g.current_user.id,
        job_id=job.id,
        form_id=form.id,
        job_title=job.title,
        job_description=job_description,
        payload=response_payload,
        processed_at=processed_at,
    )
    db.session.add(record)
    db.session.commit()

    return jsonify(response_payload)

from flask import Blueprint, g, jsonify, request

from app.auth_utils import company_required
from app.extensions import db
from app.models import ApplicationForm, Job, Submission
from app.seed import create_id, slugify

jobs_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")


@jobs_bp.get("")
@company_required
def list_jobs():
    jobs = (
        Job.query.filter_by(company_id=g.current_company_id)
        .order_by(Job.created_at.desc())
        .all()
    )
    return jsonify({"jobs": [job.to_dict() for job in jobs]})


@jobs_bp.post("")
@company_required
def create_job():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Job title is required"}), 400

    job = Job(
        id=data.get("id") or create_id("job"),
        company_id=g.current_company_id,
        title=title,
        team=(data.get("team") or "General").strip(),
        location=(data.get("location") or "Remote").strip(),
        status=data.get("status") or "open",
        description=(data.get("description") or "").strip(),
        must_have=data.get("mustHave") or [],
    )
    db.session.add(job)
    db.session.commit()
    return jsonify(job.to_dict()), 201


@jobs_bp.get("/<job_id>")
@company_required
def get_job(job_id: str):
    job = Job.query.filter_by(id=job_id, company_id=g.current_company_id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job.to_dict())


@jobs_bp.put("/<job_id>")
@company_required
def update_job(job_id: str):
    job = Job.query.filter_by(id=job_id, company_id=g.current_company_id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json(silent=True) or {}
    if "title" in data:
        job.title = (data["title"] or "").strip()
    if "team" in data:
        job.team = (data["team"] or "").strip()
    if "location" in data:
        job.location = (data["location"] or "").strip()
    if "status" in data:
        job.status = data["status"]
    if "description" in data:
        job.description = (data["description"] or "").strip()
    if "mustHave" in data:
        job.must_have = data["mustHave"] or []

    db.session.commit()
    return jsonify(job.to_dict())


@jobs_bp.delete("/<job_id>")
@company_required
def delete_job(job_id: str):
    job = Job.query.filter_by(id=job_id, company_id=g.current_company_id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    ApplicationForm.query.filter_by(job_id=job_id).delete()
    Submission.query.filter_by(job_id=job_id).delete()
    db.session.delete(job)
    db.session.commit()
    return jsonify({"ok": True})


@jobs_bp.get("/<job_id>/forms")
@company_required
def list_job_forms(job_id: str):
    job = Job.query.filter_by(id=job_id, company_id=g.current_company_id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    forms = ApplicationForm.query.filter_by(job_id=job_id).order_by(ApplicationForm.created_at.desc()).all()
    return jsonify({"forms": [form.to_dict() for form in forms]})

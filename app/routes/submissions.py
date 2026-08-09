from pathlib import Path

from flask import Blueprint, current_app, g, jsonify, request, send_file

from app.auth_utils import company_required
from app.extensions import db
from app.models import ApplicationForm, Job, Submission

submissions_bp = Blueprint("submissions", __name__, url_prefix="/api/submissions")
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@submissions_bp.get("")
@company_required
def list_submissions():
    form_id = request.args.get("formId")
    query = Submission.query.filter_by(company_id=g.current_company_id)
    if form_id:
        query = query.filter_by(form_id=form_id)

    submissions = query.order_by(Submission.submitted_at.desc()).limit(100).all()
    return jsonify({"submissions": [item.to_dict() for item in submissions]})


@submissions_bp.get("/<submission_id>")
@company_required
def get_submission(submission_id: str):
    submission = Submission.query.filter_by(
        id=submission_id, company_id=g.current_company_id
    ).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404
    return jsonify(submission.to_dict())


@submissions_bp.patch("/<submission_id>")
@company_required
def update_submission(submission_id: str):
    submission = Submission.query.filter_by(
        id=submission_id, company_id=g.current_company_id
    ).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    data = request.get_json(silent=True) or {}
    if "status" in data:
        status = (data.get("status") or "").strip().lower()
        if status not in Submission.STATUSES:
            return jsonify({"error": f"Status must be one of: {', '.join(Submission.STATUSES)}"}), 400
        submission.status = status
    if "notes" in data:
        submission.notes = (data.get("notes") or "").strip()

    db.session.commit()
    return jsonify(submission.to_dict())


@submissions_bp.get("/<submission_id>/resume")
@company_required
def download_resume(submission_id: str):
    submission = Submission.query.filter_by(
        id=submission_id, company_id=g.current_company_id
    ).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404
    if not submission.resume_path:
        return jsonify({"error": "No resume file for this application"}), 404

    file_path = Path(current_app.config["UPLOAD_FOLDER"]) / submission.resume_path
    if not file_path.is_file():
        return jsonify({"error": "Resume file is missing on the server"}), 404

    return send_file(
        file_path,
        as_attachment=True,
        download_name=submission.resume_filename or file_path.name,
    )


@dashboard_bp.get("/overview")
@company_required
def overview():
    jobs = Job.query.filter_by(company_id=g.current_company_id).all()
    forms = ApplicationForm.query.filter_by(company_id=g.current_company_id).all()
    submissions = (
        Submission.query.filter_by(company_id=g.current_company_id)
        .order_by(Submission.submitted_at.desc())
        .limit(6)
        .all()
    )

    return jsonify(
        {
            "stats": {
                "jobs": len(jobs),
                "openJobs": sum(1 for job in jobs if (job.status or "open") == "open"),
                "forms": len(forms),
                "publishedForms": sum(1 for form in forms if form.is_published),
                "submissions": Submission.query.filter_by(company_id=g.current_company_id).count(),
            },
            "recentSubmissions": [item.to_dict() for item in submissions],
        }
    )

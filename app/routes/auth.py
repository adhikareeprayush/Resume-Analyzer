from flask import Blueprint, g, jsonify, request

from app.auth_utils import create_token, login_required
from app.extensions import db
from app.models import Company, Submission, User
from app.seed import create_id


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _company_initials(name: str) -> str:
    parts = [part for part in (name or "").split() if part]
    if not parts:
        return "TL"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return f"{parts[0][0]}{parts[1][0]}".upper()


def _session_payload(user: User, company: Company | None = None):
    company = company or (Company.query.get(user.company_id) if user.company_id else None)
    return {
        "token": create_token(user),
        "user": user.to_dict(),
        "company": company.to_dict() if company else None,
    }


def _claim_submissions_for_candidate(user: User) -> int:
    """Attach prior anonymous applications that used this email."""
    rows = (
        Submission.query.filter(
            Submission.email == user.email,
            Submission.user_id.is_(None),
        ).all()
    )
    for row in rows:
        row.user_id = user.id
    return len(rows)


@auth_bp.post("/register")
def register():
    """Create a company workspace + admin account."""
    data = request.get_json(silent=True) or {}
    company_name = (data.get("companyName") or "").strip()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    industry = (data.get("industry") or "").strip() or None
    size = (data.get("size") or "").strip() or None

    if not company_name:
        return jsonify({"error": "Company name is required"}), 400
    if not name:
        return jsonify({"error": "Your name is required"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "A valid work email is required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    company = Company(
        id=create_id("co"),
        name=company_name,
        industry=industry,
        size=size,
        logo_initials=_company_initials(company_name),
    )
    user = User(
        id=create_id("usr"),
        company_id=company.id,
        email=email,
        name=name,
        role="admin",
    )
    user.set_password(password)

    db.session.add(company)
    db.session.add(user)
    db.session.commit()

    return jsonify(_session_payload(user, company)), 201


@auth_bp.post("/register-candidate")
def register_candidate():
    """Create a job-seeker account (no company)."""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name:
        return jsonify({"error": "Your name is required"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "A valid email is required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(
        id=create_id("usr"),
        company_id=None,
        email=email,
        name=name,
        role=User.ROLE_CANDIDATE,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    claimed = _claim_submissions_for_candidate(user)
    db.session.commit()

    payload = _session_payload(user, None)
    payload["claimedApplications"] = claimed
    return jsonify(payload), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    company = Company.query.get(user.company_id) if user.company_id else None
    return jsonify(_session_payload(user, company))


@auth_bp.get("/me")
@login_required
def me():
    company = Company.query.get(g.current_user.company_id) if g.current_user.company_id else None
    return jsonify(
        {
            "user": g.current_user.to_dict(),
            "company": company.to_dict() if company else None,
        }
    )

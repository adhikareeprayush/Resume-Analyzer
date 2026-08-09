from flask import Blueprint, g, jsonify, request

from app.auth_utils import admin_required, company_required
from app.extensions import db
from app.models import Company

company_bp = Blueprint("company", __name__, url_prefix="/api/company")


def _company_initials(name: str) -> str:
    parts = [part for part in (name or "").split() if part]
    if not parts:
        return "TL"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return f"{parts[0][0]}{parts[1][0]}".upper()


@company_bp.get("")
@company_required
def get_company():
    company = Company.query.get(g.current_company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404
    return jsonify(company.to_dict())


@company_bp.put("")
@admin_required
def update_company():
    company = Company.query.get(g.current_company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Company name is required"}), 400
        company.name = name
        if not data.get("logoInitials"):
            company.logo_initials = _company_initials(name)
    if "industry" in data:
        company.industry = (data.get("industry") or "").strip() or None
    if "size" in data:
        company.size = (data.get("size") or "").strip() or None
    if "logoInitials" in data:
        initials = (data.get("logoInitials") or "").strip().upper()[:8]
        company.logo_initials = initials or _company_initials(company.name)

    db.session.commit()
    return jsonify(company.to_dict())

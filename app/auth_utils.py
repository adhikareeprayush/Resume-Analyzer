from __future__ import annotations

from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

from app.models import User


def create_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=current_app.config["JWT_EXPIRE_HOURS"])
    payload = {
        "sub": user.id,
        "company_id": user.company_id,
        "role": user.role,
        "exp": expire,
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def _load_user_from_header():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    payload = decode_token(auth_header[7:])
    if not payload:
        return None
    return User.query.get(payload.get("sub"))


def optional_user():
    """Attach g.current_user when a valid token is present; otherwise leave unset."""
    user = _load_user_from_header()
    if user:
        g.current_user = user
        g.current_company_id = user.company_id
    return user


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _load_user_from_header()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        g.current_user = user
        g.current_company_id = user.company_id
        return fn(*args, **kwargs)

    return wrapper


def company_required(fn):
    """Company recruiter/admin only — blocks candidates from hiring APIs."""

    @wraps(fn)
    @login_required
    def wrapper(*args, **kwargs):
        if not g.current_user.is_company_user:
            return jsonify({"error": "Company workspace access required"}), 403
        if not g.current_company_id:
            return jsonify({"error": "No company linked to this account"}), 403
        return fn(*args, **kwargs)

    return wrapper


def candidate_required(fn):
    @wraps(fn)
    @login_required
    def wrapper(*args, **kwargs):
        if not g.current_user.is_candidate:
            return jsonify({"error": "Candidate account required"}), 403
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    @company_required
    def wrapper(*args, **kwargs):
        if not g.current_user.is_admin:
            return jsonify({"error": "Only workspace admins can do this"}), 403
        return fn(*args, **kwargs)

    return wrapper

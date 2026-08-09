from __future__ import annotations

import re

from flask import Blueprint, g, jsonify, request

from app.auth_utils import candidate_required
from app.extensions import db
from app.models import ApplicationForm, Company, Job, Submission

candidate_bp = Blueprint("candidate", __name__, url_prefix="/api/candidate")


def _normalize_list(values) -> list[str]:
    if not values:
        return []
    if isinstance(values, str):
        values = re.split(r"[,|\n]+", values)
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in values:
        text = str(item or "").strip()
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(text)
    return cleaned[:24]


def _tokens(*parts: str) -> set[str]:
    blob = " ".join(part or "" for part in parts).lower()
    return {token for token in re.findall(r"[a-z0-9+][a-z0-9+.#-]{1,}", blob) if len(token) > 1}


def _score_job_for_candidate(user, job: Job) -> dict:
    skills = [s.lower() for s in (user.interest_skills or [])]
    roles = [r.lower() for r in (user.interest_roles or [])]
    preferred_location = (user.preferred_location or "").strip().lower()

    job_skill_set = {str(s).strip().lower() for s in (job.must_have or []) if str(s).strip()}
    job_text_tokens = _tokens(job.title, job.description, " ".join(job.must_have or []))

    matched_skills: list[str] = []
    for skill in skills:
        skill_tokens = _tokens(skill)
        if skill.lower() in job_skill_set or (skill_tokens and skill_tokens <= job_text_tokens):
            matched_skills.append(skill)
        elif any(token in job_text_tokens for token in skill_tokens):
            matched_skills.append(skill)

    role_hits = 0
    title_l = (job.title or "").lower()
    for role in roles:
        if role and (role in title_l or any(tok in title_l for tok in _tokens(role))):
            role_hits += 1

    location_hit = False
    if preferred_location:
        job_loc = (job.location or "").lower()
        if preferred_location in job_loc or any(
            tok in job_loc for tok in _tokens(preferred_location) if len(tok) > 2
        ):
            location_hit = True
        elif "remote" in preferred_location and "remote" in job_loc:
            location_hit = True

    skill_score = 0
    if skills:
        skill_score = round((len(matched_skills) / len(skills)) * 55)
    elif job_skill_set:
        skill_score = 10

    role_score = min(30, role_hits * 15) if roles else (12 if job.title else 0)
    location_score = 15 if location_hit else 0

    # Mild boost when the candidate has any interests filled in.
    baseline = 8 if (skills or roles or preferred_location) else 0
    score = min(99, skill_score + role_score + location_score + baseline)

    reasons: list[str] = []
    if matched_skills:
        reasons.append(f"Skills: {', '.join(matched_skills[:4])}")
    if role_hits:
        reasons.append("Role title matches your interests")
    if location_hit:
        reasons.append("Location fits your preference")
    if not reasons and score > 0:
        reasons.append("Open role on TalentLens")

    return {
        "matchScore": score,
        "matchedSkills": matched_skills[:8],
        "reasons": reasons,
    }


@candidate_bp.get("/applications")
@candidate_required
def list_my_applications():
    rows = (
        Submission.query.filter(
            (Submission.user_id == g.current_user.id)
            | (Submission.email == g.current_user.email)
        )
        .order_by(Submission.submitted_at.desc())
        .limit(100)
        .all()
    )

    dirty = False
    for row in rows:
        if row.user_id is None:
            row.user_id = g.current_user.id
            dirty = True
    if dirty:
        db.session.commit()

    return jsonify({"applications": [row.to_candidate_dict() for row in rows]})


@candidate_bp.get("/profile")
@candidate_required
def get_profile():
    return jsonify({"user": g.current_user.to_dict()})


@candidate_bp.put("/profile")
@candidate_required
def update_profile():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    g.current_user.name = name
    if "headline" in data:
        g.current_user.headline = (data.get("headline") or "").strip()[:255] or None
    if "preferredLocation" in data:
        g.current_user.preferred_location = (data.get("preferredLocation") or "").strip()[:255] or None
    if "interestSkills" in data:
        g.current_user.interest_skills = _normalize_list(data.get("interestSkills"))
    if "interestRoles" in data:
        g.current_user.interest_roles = _normalize_list(data.get("interestRoles"))

    db.session.commit()
    return jsonify({"user": g.current_user.to_dict()})


@candidate_bp.get("/suggestions")
@candidate_required
def list_suggestions():
    """Suggest published open roles that fit the candidate's interests."""
    user = g.current_user
    applied_job_ids = {
        row.job_id
        for row in Submission.query.filter(
            (Submission.user_id == user.id) | (Submission.email == user.email)
        ).all()
    }

    forms = (
        ApplicationForm.query.filter_by(is_published=True)
        .order_by(ApplicationForm.created_at.desc())
        .limit(80)
        .all()
    )

    suggestions = []
    seen_jobs: set[str] = set()
    for form in forms:
        if form.job_id in seen_jobs:
            continue
        job = Job.query.get(form.job_id)
        if not job or (job.status or "open") != "open":
            continue
        seen_jobs.add(job.id)
        company = Company.query.get(job.company_id)
        match = _score_job_for_candidate(user, job)
        already_applied = form.job_id in applied_job_ids

        has_interests = bool(
            (user.interest_skills or [])
            or (user.interest_roles or [])
            or (user.preferred_location or "").strip()
        )
        if has_interests and match["matchScore"] < 20:
            continue

        suggestions.append(
            {
                "jobId": job.id,
                "formId": form.id,
                "slug": form.slug,
                "applyPath": f"/apply/{form.slug}",
                "jobTitle": job.title,
                "location": job.location,
                "team": job.team,
                "mustHave": job.must_have or [],
                "description": (job.description or "")[:280],
                "companyName": company.name if company else "Employer",
                "companyInitials": company.logo_initials if company else "TL",
                "formTitle": form.title,
                "alreadyApplied": already_applied,
                **match,
            }
        )

    suggestions.sort(
        key=lambda item: (0 if item["alreadyApplied"] else 1, item["matchScore"]),
        reverse=True,
    )
    # Prefer unapplied first visually: sort by not-applied then score
    suggestions.sort(key=lambda item: (item["alreadyApplied"], -item["matchScore"]))
    return jsonify(
        {
            "suggestions": suggestions[:12],
            "hasInterests": bool(
                (user.interest_skills or [])
                or (user.interest_roles or [])
                or (user.preferred_location or "").strip()
            ),
        }
    )

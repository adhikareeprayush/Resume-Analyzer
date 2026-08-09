from __future__ import annotations

import uuid
from pathlib import Path

from flask import current_app

from app.extensions import db
from app.models import (
    ApplicationForm,
    Company,
    Job,
    Submission,
    User,
)


def _write_seed_resume(submission_id: str, filename: str, body: str) -> tuple[str, str]:
    upload_root = Path(current_app.config["UPLOAD_FOLDER"])
    folder = upload_root / "submissions" / submission_id
    folder.mkdir(parents=True, exist_ok=True)
    # Store as .txt so extraction works without shipping binary PDFs.
    stored_name = filename.rsplit(".", 1)[0] + ".txt"
    path = folder / stored_name
    path.write_text(body.strip() + "\n", encoding="utf-8")
    relative = str(Path("submissions") / submission_id / stored_name)
    return relative, stored_name


DEMO_RESUMES = {
    "sub-001": (
        "resume-aayush.pdf",
        """
        Aayush Gurung
        Frontend Engineer

        Skills: Next.js, React, TypeScript, Tailwind CSS, JavaScript, REST APIs
        Experience: Built two Next.js apps with SSR and API routes.
        Collaborated with designers on accessible UI components.
        Based in Kathmandu, Nepal.
        """,
    ),
    "sub-002": (
        "sabina-cv.pdf",
        """
        Sabina Magar
        Senior Frontend Developer

        Skills: React, Next.js, TypeScript, Tailwind CSS, GraphQL, design systems
        Experience: Led frontend for a B2B SaaS dashboard for 3+ years.
        Mentored junior engineers and shipped performant React applications.
        Based in Lalitpur, Nepal.
        """,
    ),
}


def _ensure_demo_resume_files() -> None:
    """Backfill resume files/paths for the demo submissions on existing DBs."""
    demo_user = User.query.get("usr-demo")
    if demo_user and (demo_user.role or "").lower() not in {"admin", "owner"}:
        demo_user.role = "admin"
        db.session.commit()

    updated = False
    for submission_id, (filename, body) in DEMO_RESUMES.items():
        submission = Submission.query.get(submission_id)
        if not submission:
            continue
        relative, stored_name = _write_seed_resume(submission_id, filename, body)
        if submission.resume_path != relative or submission.resume_filename != stored_name:
            submission.resume_path = relative
            submission.resume_filename = stored_name
            answers = dict(submission.answers or {})
            answers["f6"] = stored_name
            submission.answers = answers
            updated = True
        if not submission.status:
            submission.status = "new"
            updated = True
    if updated:
        db.session.commit()


def _localize_demo_to_nepal() -> None:
    """Rewrite seeded India-origin mock data to Nepal on existing databases."""
    changed = False

    demo_user = User.query.get("usr-demo")
    if demo_user and demo_user.name in {"Priya Sharma", "Anisha Shrestha"}:
        if demo_user.name != "Anisha Shrestha":
            demo_user.name = "Anisha Shrestha"
            changed = True

    job_nextjs = Job.query.get("job-nextjs")
    if job_nextjs and (
        "India" in (job_nextjs.location or "")
        or "Bengaluru" in (job_nextjs.location or "")
        or "Bangalore" in (job_nextjs.location or "")
    ):
        job_nextjs.location = "Remote — Nepal"
        changed = True

    job_ml = Job.query.get("job-ml")
    if job_ml and (
        "Bengaluru" in (job_ml.location or "")
        or "Bangalore" in (job_ml.location or "")
        or "India" in (job_ml.location or "")
    ):
        job_ml.location = "Hybrid — Kathmandu"
        changed = True

    form = ApplicationForm.query.get("form-nextjs-001")
    if form and form.fields:
        fields = list(form.fields)
        rewritten = False
        for field in fields:
            if field.get("id") == "f3" and "+91" in str(field.get("placeholder") or ""):
                field["placeholder"] = "+977 ..."
                rewritten = True
        if rewritten:
            form.fields = fields
            changed = True

    sub1 = Submission.query.get("sub-001")
    if sub1:
        if sub1.candidate_name != "Aayush Gurung" or sub1.email != "aayush@email.com":
            sub1.candidate_name = "Aayush Gurung"
            sub1.email = "aayush@email.com"
            answers = dict(sub1.answers or {})
            answers["f1"] = "Aayush Gurung"
            answers["f2"] = "aayush@email.com"
            answers["f3"] = "+977 9841234567"
            sub1.answers = answers
            changed = True

    sub2 = Submission.query.get("sub-002")
    if sub2:
        if sub2.candidate_name != "Sabina Magar" or sub2.email != "sabina@email.com":
            sub2.candidate_name = "Sabina Magar"
            sub2.email = "sabina@email.com"
            answers = dict(sub2.answers or {})
            answers["f1"] = "Sabina Magar"
            answers["f2"] = "sabina@email.com"
            sub2.answers = answers
            changed = True

    candidate = User.query.get("usr-candidate")
    if candidate:
        if candidate.email in {"aarav@email.com", "aayush@email.com"} or candidate.name in {
            "Aarav Menon",
            "Aayush Gurung",
        }:
            if candidate.name != "Aayush Gurung" or candidate.email != "aayush@email.com":
                candidate.name = "Aayush Gurung"
                candidate.email = "aayush@email.com"
                changed = True
            if "India" in (candidate.preferred_location or ""):
                candidate.preferred_location = "Remote — Nepal"
                changed = True
            elif not candidate.preferred_location:
                candidate.preferred_location = "Remote — Nepal"
                changed = True

    if changed:
        db.session.commit()


def _ensure_demo_candidate() -> None:
    existing = User.query.get("usr-candidate") or User.query.filter_by(email="aayush@email.com").first()
    if not existing:
        existing = User.query.filter_by(email="aarav@email.com").first()

    if existing:
        if (existing.role or "").lower() != User.ROLE_CANDIDATE:
            return
        changed = False
        if existing.email != "aayush@email.com" or existing.name != "Aayush Gurung":
            existing.email = "aayush@email.com"
            existing.name = "Aayush Gurung"
            changed = True
        if not existing.interest_skills:
            existing.headline = existing.headline or "Frontend engineer · React & Next.js"
            existing.preferred_location = existing.preferred_location or "Remote — Nepal"
            existing.interest_skills = ["Next.js", "React", "TypeScript", "Tailwind CSS"]
            existing.interest_roles = ["Junior Next.js Developer", "Frontend Engineer"]
            changed = True
        if "India" in (existing.preferred_location or ""):
            existing.preferred_location = "Remote — Nepal"
            changed = True
        for row in Submission.query.filter(
            Submission.email.in_(["aayush@email.com", "aarav@email.com"]),
            Submission.user_id.is_(None),
        ).all():
            row.user_id = existing.id
            changed = True
        if changed:
            db.session.commit()
        return

    user = User(
        id="usr-candidate",
        company_id=None,
        email="aayush@email.com",
        name="Aayush Gurung",
        role=User.ROLE_CANDIDATE,
        headline="Frontend engineer · React & Next.js",
        preferred_location="Remote — Nepal",
        interest_skills=["Next.js", "React", "TypeScript", "Tailwind CSS"],
        interest_roles=["Junior Next.js Developer", "Frontend Engineer"],
    )
    user.set_password("candidate123")
    db.session.add(user)
    db.session.flush()
    for row in Submission.query.filter(
        Submission.email.in_(["aayush@email.com", "aarav@email.com"])
    ).all():
        row.user_id = user.id
    db.session.commit()


def seed_database() -> None:
    if Company.query.get("co-demo"):
        _ensure_demo_resume_files()
        _localize_demo_to_nepal()
        _ensure_demo_candidate()
        return

    company = Company(
        id="co-demo",
        name="Northstar Labs",
        industry="Technology",
        size="50–200",
        logo_initials="NL",
    )
    db.session.add(company)

    user = User(
        id="usr-demo",
        company_id=company.id,
        email="demo@talentlens.io",
        name="Anisha Shrestha",
        role="admin",
    )
    user.set_password("demo123")
    db.session.add(user)

    job_nextjs = Job(
        id="job-nextjs",
        company_id=company.id,
        title="Junior Next.js Developer",
        team="Product Engineering",
        location="Remote — Nepal",
        status="open",
        description=(
            "Build and maintain web applications using Next.js and React. "
            "Collaborate with designers and backend engineers on performant, accessible UI."
        ),
        must_have=["Next.js", "React", "TypeScript", "Tailwind CSS"],
    )
    job_ml = Job(
        id="job-ml",
        company_id=company.id,
        title="Machine Learning Engineer",
        team="Applied Intelligence",
        location="Hybrid — Kathmandu",
        status="open",
        description=(
            "Train and evaluate models for hiring intelligence. "
            "Ship Flask APIs and work with NLP pipelines."
        ),
        must_have=["Python", "PyTorch", "Model Evaluation", "Flask"],
    )
    db.session.add_all([job_nextjs, job_ml])

    form = ApplicationForm(
        id="form-nextjs-001",
        job_id=job_nextjs.id,
        company_id=company.id,
        title="Next.js Developer Application",
        slug="northstar-nextjs-2026",
        is_published=True,
        fields=[
            {"id": "f1", "type": "text", "label": "Full name", "required": True, "placeholder": "Your full name"},
            {"id": "f2", "type": "email", "label": "Email address", "required": True, "placeholder": "you@email.com"},
            {"id": "f3", "type": "phone", "label": "Phone number", "required": False, "placeholder": "+977 ..."},
            {
                "id": "f4",
                "type": "select",
                "label": "Years of React experience",
                "required": True,
                "options": ["0–1 years", "1–3 years", "3+ years"],
            },
            {
                "id": "f5",
                "type": "textarea",
                "label": "Why do you want to join Northstar Labs?",
                "required": True,
                "placeholder": "Tell us about your motivation and relevant projects.",
            },
            {"id": "f6", "type": "file", "label": "Upload resume (PDF)", "required": True, "accept": ".pdf,.docx"},
            {
                "id": "f7",
                "type": "checkbox",
                "label": "I confirm the information provided is accurate",
                "required": True,
            },
        ],
    )
    db.session.add(form)

    aayush_path, aayush_file = _write_seed_resume("sub-001", *DEMO_RESUMES["sub-001"])
    sabina_path, sabina_file = _write_seed_resume("sub-002", *DEMO_RESUMES["sub-002"])

    submissions = [
        Submission(
            id="sub-001",
            form_id=form.id,
            job_id=job_nextjs.id,
            company_id=company.id,
            candidate_name="Aayush Gurung",
            email="aayush@email.com",
            answers={
                "f1": "Aayush Gurung",
                "f2": "aayush@email.com",
                "f3": "+977 9841234567",
                "f4": "1–3 years",
                "f5": "Built two Next.js apps with SSR and API routes.",
                "f6": aayush_file,
                "f7": True,
            },
            resume_path=aayush_path,
            resume_filename=aayush_file,
            status="new",
        ),
        Submission(
            id="sub-002",
            form_id=form.id,
            job_id=job_nextjs.id,
            company_id=company.id,
            candidate_name="Sabina Magar",
            email="sabina@email.com",
            answers={
                "f1": "Sabina Magar",
                "f2": "sabina@email.com",
                "f4": "3+ years",
                "f5": "Led frontend for a B2B SaaS dashboard.",
                "f6": sabina_file,
                "f7": True,
            },
            resume_path=sabina_path,
            resume_filename=sabina_file,
            status="reviewed",
        ),
    ]
    db.session.add_all(submissions)
    db.session.commit()
    _ensure_demo_candidate()


def create_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def slugify(text: str) -> str:
    import re

    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return slug[:48]

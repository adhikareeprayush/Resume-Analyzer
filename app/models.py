from __future__ import annotations

from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(128))
    size = db.Column(db.String(64))
    logo_initials = db.Column(db.String(8))
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    users = db.relationship("User", back_populates="company", lazy=True)
    jobs = db.relationship("Job", back_populates="company", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "industry": self.industry,
            "size": self.size,
            "logoInitials": self.logo_initials,
        }


class User(db.Model):
    __tablename__ = "users"

    ROLES_COMPANY = ("admin", "recruiter")
    ROLE_CANDIDATE = "candidate"

    id = db.Column(db.String(64), primary_key=True)
    company_id = db.Column(db.String(64), db.ForeignKey("companies.id"), nullable=True, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(64), default="admin")
    # Candidate preference fields (ignored for company users)
    headline = db.Column(db.String(255))
    preferred_location = db.Column(db.String(255))
    interest_skills = db.Column(db.JSON, default=list)
    interest_roles = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    company = db.relationship("Company", back_populates="users")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def is_candidate(self) -> bool:
        return (self.role or "").lower() == self.ROLE_CANDIDATE

    @property
    def is_company_user(self) -> bool:
        return not self.is_candidate and bool(self.company_id)

    @property
    def is_admin(self) -> bool:
        return (self.role or "").lower() in {"admin", "owner", "talent lead"}

    @property
    def is_recruiter(self) -> bool:
        return self.is_company_user and (
            self.is_admin or (self.role or "").lower() in {"recruiter", "talent lead"}
        )

    def to_dict(self):
        payload = {
            "id": self.id,
            "companyId": self.company_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "accountType": "candidate" if self.is_candidate else "company",
        }
        if self.is_candidate:
            payload.update(
                {
                    "headline": self.headline or "",
                    "preferredLocation": self.preferred_location or "",
                    "interestSkills": self.interest_skills or [],
                    "interestRoles": self.interest_roles or [],
                }
            )
        return payload


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.String(64), primary_key=True)
    company_id = db.Column(db.String(64), db.ForeignKey("companies.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    team = db.Column(db.String(128))
    location = db.Column(db.String(255))
    status = db.Column(db.String(32), default="open")
    description = db.Column(db.Text, default="")
    must_have = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    company = db.relationship("Company", back_populates="jobs")
    forms = db.relationship("ApplicationForm", back_populates="job", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "companyId": self.company_id,
            "title": self.title,
            "team": self.team,
            "location": self.location,
            "status": self.status,
            "description": self.description,
            "mustHave": self.must_have or [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class ApplicationForm(db.Model):
    __tablename__ = "application_forms"

    id = db.Column(db.String(64), primary_key=True)
    job_id = db.Column(db.String(64), db.ForeignKey("jobs.id"), nullable=False, index=True)
    company_id = db.Column(db.String(64), db.ForeignKey("companies.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(128), unique=True, nullable=False, index=True)
    is_published = db.Column(db.Boolean, default=False, nullable=False)
    fields = db.Column(db.JSON, default=list)
    fjorm_data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    job = db.relationship("Job", back_populates="forms")
    submissions = db.relationship("Submission", back_populates="form", lazy=True)

    def to_dict(self, include_fields=True):
        payload = {
            "id": self.id,
            "jobId": self.job_id,
            "companyId": self.company_id,
            "title": self.title,
            "slug": self.slug,
            "isPublished": self.is_published,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
        if include_fields:
            payload["fields"] = self.fields or []
            payload["fjormData"] = self.fjorm_data
        return payload


class Submission(db.Model):
    __tablename__ = "submissions"

    STATUSES = ("new", "reviewed", "shortlisted", "rejected", "hired")

    id = db.Column(db.String(64), primary_key=True)
    form_id = db.Column(db.String(64), db.ForeignKey("application_forms.id"), nullable=False, index=True)
    job_id = db.Column(db.String(64), db.ForeignKey("jobs.id"), nullable=False, index=True)
    company_id = db.Column(db.String(64), db.ForeignKey("companies.id"), nullable=False, index=True)
    candidate_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    answers = db.Column(db.JSON, default=dict)
    resume_path = db.Column(db.String(512))
    resume_filename = db.Column(db.String(255))
    status = db.Column(db.String(32), default="new", nullable=False, index=True)
    notes = db.Column(db.Text, default="")
    user_id = db.Column(db.String(64), db.ForeignKey("users.id"), index=True)
    submitted_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    form = db.relationship("ApplicationForm", back_populates="submissions")
    applicant = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "formId": self.form_id,
            "jobId": self.job_id,
            "companyId": self.company_id,
            "userId": self.user_id,
            "candidateName": self.candidate_name,
            "email": self.email,
            "answers": self.answers or {},
            "resumeFilename": self.resume_filename,
            "hasResumeFile": bool(self.resume_path),
            "status": self.status or "new",
            "notes": self.notes or "",
            "submittedAt": self.submitted_at.isoformat() if self.submitted_at else None,
        }

    def to_candidate_dict(self):
        job = Job.query.get(self.job_id)
        form = ApplicationForm.query.get(self.form_id)
        company = Company.query.get(self.company_id)
        return {
            "id": self.id,
            "status": self.status or "new",
            "submittedAt": self.submitted_at.isoformat() if self.submitted_at else None,
            "jobTitle": job.title if job else "Role",
            "jobLocation": job.location if job else None,
            "formTitle": form.title if form else "Application",
            "companyName": company.name if company else "Employer",
            "companyInitials": company.logo_initials if company else "TL",
            "hasResumeFile": bool(self.resume_path),
        }


class AnalysisRecord(db.Model):
    __tablename__ = "analysis_records"

    id = db.Column(db.String(64), primary_key=True)
    company_id = db.Column(db.String(64), db.ForeignKey("companies.id"), index=True)
    user_id = db.Column(db.String(64), db.ForeignKey("users.id"))
    job_id = db.Column(db.String(64), db.ForeignKey("jobs.id"), index=True)
    form_id = db.Column(db.String(64), db.ForeignKey("application_forms.id"), index=True)
    job_title = db.Column(db.String(255), nullable=False)
    job_description = db.Column(db.Text, default="")
    payload = db.Column(db.JSON, nullable=False)
    processed_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    def to_history_item(self):
        summary = (self.payload or {}).get("summary", {})
        return {
            "analysisId": self.id,
            "jobId": self.job_id,
            "formId": self.form_id,
            "jobTitle": self.job_title,
            "processedAt": self.processed_at.isoformat() if self.processed_at else None,
            "totalResumes": summary.get("totalResumes", 0),
            "avgScore": summary.get("avgScore", 0),
            "topScore": summary.get("topScore", 0),
        }

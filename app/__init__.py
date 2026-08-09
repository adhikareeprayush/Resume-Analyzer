from __future__ import annotations

from pathlib import Path

from flask import Flask, abort, jsonify, send_from_directory
from flask_cors import CORS

from app.config import Config
from app.extensions import db
from app.routes.analyze import analyze_bp
from app.routes.auth import auth_bp
from app.routes.candidate import candidate_bp
from app.routes.company import company_bp
from app.routes.forms import forms_bp
from app.routes.jobs import jobs_bp
from app.routes.submissions import dashboard_bp, submissions_bp
from app.seed import seed_database


def _ensure_schema() -> None:
    """Add columns introduced after initial create_all (Postgres-safe)."""
    statements = [
        "ALTER TABLE analysis_records ADD COLUMN IF NOT EXISTS job_id VARCHAR(64)",
        "ALTER TABLE analysis_records ADD COLUMN IF NOT EXISTS form_id VARCHAR(64)",
        "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS resume_path VARCHAR(512)",
        "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS resume_filename VARCHAR(255)",
        "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'new'",
        "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''",
        "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id VARCHAR(64)",
        "ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_location VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS interest_skills JSONB DEFAULT '[]'::jsonb",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS interest_roles JSONB DEFAULT '[]'::jsonb",
    ]
    with db.engine.begin() as conn:
        for statement in statements:
            conn.exec_driver_sql(statement)
        conn.exec_driver_sql(
            "UPDATE submissions SET status = 'new' WHERE status IS NULL"
        )


def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": [origin.strip() for origin in app.config["CORS_ORIGINS"] if origin.strip()]}},
        supports_credentials=True,
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(company_bp)
    app.register_blueprint(candidate_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(forms_bp)
    app.register_blueprint(submissions_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(analyze_bp)

    _ensure_dirs(app)

    with app.app_context():
        db.create_all()
        _ensure_schema()
        seed_database()

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path: str):
        if path.startswith("api/"):
            abort(404)

        dist = Path(app.config["FRONTEND_DIST"])
        if dist.exists():
            requested = dist / path
            if path and requested.exists() and requested.is_file():
                return send_from_directory(dist, path)
            index_file = dist / "index.html"
            if index_file.exists():
                return send_from_directory(dist, "index.html")

        return jsonify(
            {
                "service": "talentlens-atlas",
                "message": "API is running. Build the React frontend or call /api endpoints.",
            }
        )

    return app


def _ensure_dirs(app: Flask) -> None:
    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)
    Path(app.config["INSTANCE_FOLDER"]).mkdir(parents=True, exist_ok=True)
    Path(app.config["ANALYSIS_FOLDER"]).mkdir(parents=True, exist_ok=True)

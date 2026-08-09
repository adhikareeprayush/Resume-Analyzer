# TalentLens Atlas — Resume Analyzer

Full-stack hiring workspace: post jobs, build application forms, collect submissions, and rank resumes against job descriptions with a fine-tuned BERT fit model.

## Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Flask, SQLAlchemy, JWT auth
- **Database**: PostgreSQL 16 (host port **5433** — non-default)
- **ML**: Hugging Face Transformers (`models/resume-fit-final`)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

| Service    | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:3000    |
| API       | http://localhost:5001    |
| PostgreSQL| localhost:**5433**       |

**Demo login (company):** `demo@talentlens.io` / `demo123`  
**Demo login (candidate):** `aayush@email.com` / `candidate123`

The API seeds a demo company (Northstar Labs, Nepal) with sample jobs, a published form, and submissions on first startup.

## Local development (without Docker)

### 1. PostgreSQL

Run Postgres on port **5433** (or set `DATABASE_URL` in `.env`):

```bash
docker compose up db -d
```

### 2. Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

API listens on **http://localhost:5001**.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev server proxies `/api` to port 5001. Open **http://localhost:5173**.

## API overview

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/auth/login` | — | Email/password login |
| `GET /api/auth/me` | JWT | Current user |
| `GET/POST /api/jobs` | JWT | List/create jobs |
| `GET/PUT/DELETE /api/jobs/:id` | JWT | Job CRUD |
| `GET/POST /api/forms` | JWT | Form CRUD |
| `GET /api/forms/public/:slug` | — | Public apply form |
| `POST /api/forms/public/:slug/submit` | — | Submit application |
| `GET /api/submissions` | JWT | List submissions |
| `GET /api/dashboard/overview` | JWT | Workspace stats |
| `POST /api/analyze` | optional JWT | Rank resumes (multipart) |
| `GET /api/analysis-history` | JWT | Past analyses |
| `GET /api/health` | — | Service health |

## Environment variables

See `.env.example` for all options. Key values:

- `POSTGRES_PORT=5433` — host port for Postgres
- `API_PORT=5001` — Flask/gunicorn port
- `FRONTEND_PORT=3000` — nginx in Docker
- `DATABASE_URL` — SQLAlchemy connection string
- `SECRET_KEY` — JWT signing key

## Project layout

```
app/                  Flask application factory & routes
frontend/             React SPA
models/resume-fit-final/   BERT classifier weights
uploads/              Uploaded resume files
instance/             Analysis artifacts
docker-compose.yml    db + api + frontend
```

## Notes

- Resume uploads accept PDF, DOCX, and TXT (up to 150 per batch by default).
- Analysis history is scoped to the logged-in company when a JWT is sent with `/api/analyze`.
- For production, change `SECRET_KEY` and database credentials.

# Backend Guide

## Goal
Build the backend into a production-ready service that can ingest a job description and multiple resumes, run a trained model, return ranked results, and expose the exact analysis signals the frontend needs to explain the match.

## What the backend must return
The response should include enough data for the UI to show a clear, explainable analysis.

Minimum response fields:
- `analysisId`
- `jobTitle`
- `jobDescription`
- `uploadedFiles`
- `invalidFiles`
- `processedAt`
- `keywords`
- `rankedResumes`
- `summary`
- `history`

Each item in `rankedResumes` should include:
- `id`
- `resumeName`
- `score`
- `confidence`
- `skillsMatched`
- `gapRisk`
- `matchedKeywords`
- `missingKeywords`
- `recommendation`
- `explanation`

## Core product requirements

### 1. Resume ingestion
- Accept `.pdf`, `.docx`, and `.txt` files.
- Validate file type, file size, and number of files.
- Save uploads per analysis request in a durable storage path.
- Extract raw text from each file reliably.
- Handle empty or unreadable resumes gracefully.

### 2. Job description processing
- Accept a job title and job description text.
- Clean and normalize the text before analysis.
- Extract high-value keywords from the job description.
- Preserve the original job description in the returned payload.

### 3. Matching logic
The backend should not only rank resumes, but also explain why.

Required matching outputs:
- Matched keywords between job description and each resume
- Missing keywords or skill gaps
- Confidence score
- Similarity score or model score
- Brief recommendation sentence

This is important because the frontend needs to show a transparent analysis, not just a number.

### 4. Ranking model
The current TF-IDF baseline is useful for a prototype, but the final system should use a trained model.

Suggested progression:
- Phase A: TF-IDF + cosine similarity baseline
- Phase B: pretrained embedding model for semantic matching
- Phase C: fine-tuned ranking model on labeled resume-job pairs
- Phase D: explanation layer that surfaces matched and missing keywords

For the final model, make sure it can:
- Rank candidates by fit
- Compare semantic similarity, not just exact word overlap
- Return stable and reproducible scores
- Support batch inference for many resumes at once

### 5. Explainability layer
This project succeeds only if recruiters understand why a resume ranked high or low.

The backend should generate:
- `matchedKeywords`: keywords present in both the JD and resume
- `missingKeywords`: important JD keywords not found in the resume
- `summaryNotes`: a short human-readable analysis note
- `recommendation`: shortlist / review / reject style guidance

If you later train a pretrained model, use the model output plus keyword overlap to produce the explanation layer.

### 6. Persistence
Store backend data in a way that supports future production use.

Recommended storage layers:
- File storage or object storage for uploaded resumes
- JSON or database records for analysis results
- Historical analysis store for previous runs
- Metadata store for search, filtering, and audit trails

Recommended long-term option:
- Object storage for files
- PostgreSQL or SQLite for metadata and analysis history
- Separate model inference service if the model gets heavy

### 7. API endpoints
These endpoints should exist for the frontend.

Required APIs:
- `GET /api/health`
- `POST /api/analyze`
- `GET /api/analysis-history`
- `GET /api/analysis/<analysisId>`

Useful future APIs:
- `POST /api/model/retrain`
- `GET /api/model/status`
- `GET /api/keywords/suggest`
- `GET /api/resume/<id>`

### 8. Frontend integration contract
The backend should always return data in a UI-friendly shape.

The frontend needs:
- Ranked cards for top resumes
- Analysis summary tiles
- Keywords matched and missing
- Chart data for score distribution and confidence comparison
- Recent analysis history
- Clear status and error messages

Do not make the frontend do heavy processing that belongs in the backend.

### 9. Model training plan
If you are training a pretrained model, this is the recommended backend roadmap.

Required training pipeline:
- Collect labeled resume-job pairs
- Clean and tokenize text
- Split train / validation / test sets
- Train or fine-tune a pretrained transformer or embedding model
- Evaluate ranking quality with ranking metrics
- Store the final model version and metadata

Recommended metrics:
- Precision@K
- Recall@K
- MRR
- nDCG
- Top-1 accuracy for shortlist decisions

Training data should include:
- Job description text
- Resume text
- Match label or relevance score
- Optional recruiter feedback
- Skill tags and role family

### 10. Keyword extraction requirements
Because the user explicitly wants matched keywords shown, the backend should generate keyword-level fields for every analysis.

Required keyword outputs:
- Overall keywords extracted from the job description
- Matched keywords per resume
- Missing keywords per resume
- Optional keyword weights or importance scores

Best practice:
- Use named entity recognition or skill taxonomy enrichment later
- Keep a deterministic fallback keyword extractor for reliability
- Surface the keyword data in the API response so the UI can show it directly

### 11. Error handling
The backend should never fail silently.

Handle and return clear errors for:
- Empty job description
- No files uploaded
- Too many files
- Unsupported file types
- File parsing failures
- Model inference failure
- Storage write failures
- Invalid payload shape

Recommended response style:
- Use JSON error messages
- Include a short user-facing message
- Include a machine-readable error code when possible

### 12. Security and production readiness
To make this project successful in production, the backend should also support:
- File size limits
- Input sanitization
- Safe filenames
- Rate limiting
- Authentication later if multi-user access is needed
- CORS only for trusted frontend origins
- Logging for analysis requests and failures

### 13. Deployment target
Recommended production deployment setup:
- Flask behind Gunicorn or another WSGI server
- Reverse proxy such as Nginx
- Persistent storage for uploads
- Environment variables for model path, storage path, and frontend origin

## What is already implemented
- Upload handling for PDF, DOCX, and TXT
- Text extraction from uploaded resumes
- TF-IDF baseline analysis
- JSON API endpoints for frontend integration
- Analysis history storage
- Frontend proxy integration in development

## What is still remaining for the full success path
- Add matched and missing keyword fields to the analysis response
- Replace or augment the TF-IDF baseline with a pretrained model
- Add stronger metadata storage instead of only JSON files
- Add model versioning and training pipeline scripts
- Add ranking explanations generated by the model
- Add evaluation reports for the trained model
- Add authentication if the system will be used by multiple organizations

## Recommended next implementation order
1. Add keyword matching fields to the API response.
2. Train a pretrained model on labeled resume-job pairs.
3. Store models and analysis results with version metadata.
4. Return explanation data that the UI can render directly.
5. Add evaluation metrics and retraining workflow.
6. Move analysis persistence to a database or object store.

## Summary
The project succeeds when the backend does three things well:
- Rank resumes accurately
- Explain the match clearly
- Deliver structured data that the frontend can render without extra logic

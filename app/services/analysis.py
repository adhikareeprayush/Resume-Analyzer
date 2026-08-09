from __future__ import annotations

from pathlib import Path

from skill_keywords import extract_job_keywords, keyword_matches_resume, match_keywords_for_resume

FIT_LABELS = {0: "No Fit", 1: "Potential Fit", 2: "Good Fit"}
FIT_SCORE_WEIGHTS = (38, 72, 92)
FIT_TIERS = [
    {"label": "Good Fit", "scoreRange": "85%+", "minScore": 85, "maxScore": 99},
    {"label": "Potential Fit", "scoreRange": "75–84%", "minScore": 75, "maxScore": 84},
    {"label": "No Fit", "scoreRange": "Below 75%", "minScore": 0, "maxScore": 74},
]

_tokenizer = None
_model = None


def get_fit_model(model_path: Path):
    global _tokenizer, _model
    if _model is None:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        if not model_path.is_dir():
            raise FileNotFoundError(f"Model not found at {model_path}")

        _tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        _model = AutoModelForSequenceClassification.from_pretrained(str(model_path))
        _model.eval()
    return _tokenizer, _model


def predict_resume_fit(resume_text: str, job_description: str, model_path: Path) -> dict:
    import torch

    tokenizer, model = get_fit_model(model_path)
    resume = (resume_text or "").strip() or " "
    job = (job_description or "").strip() or " "

    inputs = tokenizer(resume, job, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=-1)[0]

    pred_idx = int(probs.argmax().item())
    score = max(0, min(99, round(sum(probs[i].item() * FIT_SCORE_WEIGHTS[i] for i in range(3)))))
    confidence = max(0, min(99, round(float(probs[pred_idx]) * 100)))

    return {
        "fitLabel": FIT_LABELS[pred_idx],
        "fitClass": pred_idx,
        "probabilities": {
            "noFit": round(probs[0].item(), 4),
            "potentialFit": round(probs[1].item(), 4),
            "goodFit": round(probs[2].item(), 4),
        },
        "score": score,
        "confidence": confidence,
    }


def score_analysis(
    job_description: str,
    resume_texts: list[str],
    resume_names: list[str],
    model_path: Path,
    resume_ids: list[str] | None = None,
) -> dict:
    keywords = extract_job_keywords(job_description)

    matched_keywords_overall: list[str] = []
    missing_keywords_overall: list[str] = []
    for keyword in keywords:
        if any(keyword_matches_resume(keyword, resume_text) for resume_text in resume_texts):
            matched_keywords_overall.append(keyword)
        else:
            missing_keywords_overall.append(keyword)

    ranked_resumes: list[dict] = []
    for index, name in enumerate(resume_names):
        raw_text = resume_texts[index]
        matched_keywords, missing_keywords = match_keywords_for_resume(keywords, raw_text)
        keyword_coverage = len(matched_keywords) / len(keywords) if keywords else 0

        prediction = predict_resume_fit(raw_text, job_description, model_path)
        score = prediction["score"]
        confidence = prediction["confidence"]
        fit_label = prediction["fitLabel"]
        skills_matched = max(1, min(8, len(matched_keywords) or round(score / 14) or 1))
        gap_risk = max(5, 100 - score)
        explanation = (
            f"Model prediction: {fit_label}. "
            f"Matched {len(matched_keywords)} of {len(keywords)} role skills/keywords."
            if keywords
            else f"Model prediction: {fit_label}."
        )
        submission_id = resume_ids[index] if resume_ids and index < len(resume_ids) else None

        ranked_resumes.append(
            {
                "id": submission_id or f"{name}-{index}",
                "submissionId": submission_id,
                "resumeName": name,
                "score": score,
                "confidence": confidence,
                "fitLabel": fit_label,
                "fitClass": prediction["fitClass"],
                "probabilities": prediction["probabilities"],
                "skillsMatched": skills_matched,
                "gapRisk": gap_risk,
                "keywordCoverage": round(keyword_coverage * 100),
                "matchedKeywords": matched_keywords,
                "missingKeywords": missing_keywords,
                "explanation": explanation,
                "recommendation": (
                    "Strong shortlist profile based on role alignment."
                    if fit_label == "Good Fit"
                    else "Promising profile with a few role-specific gaps."
                    if fit_label == "Potential Fit"
                    else "Requires deeper review for fit and technical readiness."
                ),
            }
        )

    ranked_resumes.sort(key=lambda item: item["score"], reverse=True)

    summary = {
        "totalResumes": len(ranked_resumes),
        "avgScore": round(sum(item["score"] for item in ranked_resumes) / len(ranked_resumes))
        if ranked_resumes
        else 0,
        "topScore": ranked_resumes[0]["score"] if ranked_resumes else 0,
        "keywordInsights": {
            "totalKeywords": len(keywords),
            "matchedKeywordsCount": len(matched_keywords_overall),
            "missingKeywordsCount": len(missing_keywords_overall),
            "coverageRate": round((len(matched_keywords_overall) / len(keywords)) * 100) if keywords else 0,
        },
        "distribution": {
            "high": sum(1 for item in ranked_resumes if item["score"] >= 85),
            "medium": sum(1 for item in ranked_resumes if 75 <= item["score"] < 85),
            "low": sum(1 for item in ranked_resumes if item["score"] < 75),
        },
        "fitTiers": FIT_TIERS,
    }

    return {
        "keywords": keywords,
        "matchedKeywords": matched_keywords_overall,
        "missingKeywords": missing_keywords_overall,
        "rankedResumes": ranked_resumes,
        "summary": summary,
    }

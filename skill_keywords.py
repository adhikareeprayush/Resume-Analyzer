"""Skill-focused keyword extraction and resume matching."""

from __future__ import annotations

import re
import unicodedata

# Boilerplate from job templates — never treat as skills.
STOPWORDS = frozenset(
    {
        "about",
        "the",
        "and",
        "for",
        "with",
        "from",
        "that",
        "this",
        "your",
        "our",
        "are",
        "you",
        "will",
        "job",
        "role",
        "work",
        "team",
        "using",
        "use",
        "used",
        "such",
        "have",
        "has",
        "had",
        "been",
        "being",
        "into",
        "over",
        "under",
        "between",
        "within",
        "across",
        "other",
        "more",
        "most",
        "some",
        "any",
        "all",
        "can",
        "may",
        "must",
        "should",
        "would",
        "could",
        "also",
        "well",
        "able",
        "including",
        "include",
        "includes",
        "required",
        "preferred",
        "qualifications",
        "responsibilities",
        "description",
        "developer",
        "engineer",
        "junior",
        "senior",
        "basic",
        "knowledge",
        "familiarity",
        "understanding",
        "experience",
        "skills",
        "skill",
        "strong",
        "good",
        "excellent",
        "ability",
        "years",
        "year",
        "plus",
        "etc",
        "via",
        "per",
        "day",
        "week",
        "month",
        "develop",
        "maintain",
        "build",
        "write",
        "learn",
        "apply",
        "participate",
        "collaborate",
        "optimize",
        "debug",
        "troubleshoot",
        "applications",
        "application",
        "features",
        "components",
        "members",
        "meetings",
        "reviews",
        "practices",
        "concepts",
        "platforms",
        "deployment",
        "personal",
        "academic",
        "projects",
        "project",
        "designers",
        "backend",
        "frontend",
        "modern",
        "clean",
        "scalable",
        "maintainable",
        "responsiveness",
        "responsive",
        "performance",
        "optimization",
        "problem",
        "solving",
        "communication",
        "rendering",
        "static",
        "generation",
        "server",
        "side",
        "control",
        "systems",
        "version",
        "integration",
        "platform",
        "databases",
        "database",
        "design",
        "web",
        "of",
        "reusable",
        "problem",
        "solving",
        "troubleshoot",
        "issues",
        "code",
        "ui",
    }
)

# (regex, canonical display label) — order matters for overlapping patterns.
SKILL_PATTERNS: list[tuple[str, str]] = [
    (r"\bnext\.?\s*js\b", "Next.js"),
    (r"\breact\.?\s*js\b", "React"),
    (r"\bnode\.?\s*js\b", "Node.js"),
    (r"\bvue\.?\s*js\b", "Vue.js"),
    (r"\bexpress\.?\s*js\b", "Express.js"),
    (r"\btypescript\b", "TypeScript"),
    (r"\bjavascript\b", "JavaScript"),
    (r"\bpython\b", "Python"),
    (r"\bjava\b", "Java"),
    (r"\bhtml\b", "HTML"),
    (r"\bcss\b", "CSS"),
    (r"\btailwind\s*css\b", "Tailwind CSS"),
    (r"\bbootstrap\b", "Bootstrap"),
    (r"\bmaterial\s*ui\b", "Material UI"),
    (r"\bpostgresql\b", "PostgreSQL"),
    (r"\bmysql\b", "MySQL"),
    (r"\bmongodb\b", "MongoDB"),
    (r"\bredis\b", "Redis"),
    (r"\bdjango\b", "Django"),
    (r"\bflask\b", "Flask"),
    (r"\bfastapi\b", "FastAPI"),
    (r"\bgraphql\b", "GraphQL"),
    (r"\bkubernetes\b", "Kubernetes"),
    (r"\bdocker\b", "Docker"),
    (r"\baws\b", "AWS"),
    (r"\bazure\b", "Azure"),
    (r"\bgcp\b", "GCP"),
    (r"\bgit\b", "Git"),
    (r"\bgithub\b", "GitHub"),
    (r"\bgitlab\b", "GitLab"),
    (r"\brest\s*apis?\b", "REST API"),
    (r"\brest\b", "REST"),
    (r"\bapi\b", "API"),
    (r"\bseo\b", "SEO"),
    (r"\bvercel\b", "Vercel"),
    (r"\bnetlify\b", "Netlify"),
    (r"\bfigma\b", "Figma"),
    (r"\bredux\b", "Redux"),
    (r"\bwebpack\b", "Webpack"),
    (r"\bvite\b", "Vite"),
    (r"\bnpm\b", "npm"),
    (r"\bpnpm\b", "pnpm"),
    (r"\bpytorch\b", "PyTorch"),
    (r"\btensorflow\b", "TensorFlow"),
    (r"\bscikit[\s-]?learn\b", "scikit-learn"),
    (r"\bnlp\b", "NLP"),
    (r"\bmachine\s+learning\b", "Machine Learning"),
    (r"\bdeep\s+learning\b", "Deep Learning"),
    (r"\bllm\b", "LLM"),
    (r"\bopenai\b", "OpenAI"),
    (r"\btransformers\b", "Transformers"),
    (r"\bpandas\b", "Pandas"),
    (r"\bnumpy\b", "NumPy"),
    (r"\bspark\b", "Spark"),
    (r"\bsql\b", "SQL"),
    (r"\bpower\s*bi\b", "Power BI"),
    (r"\btableau\b", "Tableau"),
    (r"\bjenkins\b", "Jenkins"),
    (r"\bci/?cd\b", "CI/CD"),
    (r"\bagile\b", "Agile"),
    (r"\bscrum\b", "Scrum"),
    (r"\bjira\b", "Jira"),
    (r"\bpostman\b", "Postman"),
    (r"\bssr\b", "SSR"),
    (r"\bssg\b", "SSG"),
]

SECTION_HEADERS = (
    "required skills",
    "preferred qualifications",
    "qualifications",
    "requirements",
    "required",
    "nice to have",
    "bonus",
    "tech stack",
    "technologies",
)

NEXT_SECTION_MARKERS = (
    "responsibilities",
    "about the job",
    "about",
    "what you",
    "who you",
    "benefits",
    "equal opportunity",
)


def _fix_mojibake(text: str) -> str:
    if not text:
        return ""
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00e2\u20ac\u201d": "-",
        "\u00e2\u20ac\u201c": "-",
        "â€”": "-",
        "â€“": "-",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return unicodedata.normalize("NFKC", text)


def normalize_key(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", _fix_mojibake(text).lower())


def _search_variants(canonical: str) -> list[str]:
    """Normalized keys to look for inside resume/job text."""
    keys = {normalize_key(canonical)}
    lowered = canonical.lower()
    if "." in lowered:
        keys.add(normalize_key(lowered.replace(".", "")))
        keys.add(normalize_key(lowered.replace(".", " ")))
    if " " in canonical:
        keys.add(normalize_key(canonical.replace(" ", "")))
    aliases = {
        "next.js": ["nextjs", "next"],
        "react": ["reactjs", "react"],
        "node.js": ["nodejs", "node"],
        "vue.js": ["vuejs"],
        "javascript": ["js"],
        "typescript": ["ts"],
        "rest api": ["restapi", "rest"],
        "tailwind css": ["tailwindcss", "tailwind"],
        "material ui": ["materialui", "mui"],
        "machine learning": ["ml"],
        "scikit-learn": ["sklearn", "scikitlearn"],
    }
    canon_key = normalize_key(canonical)
    for alias in aliases.get(canon_key, aliases.get(lowered, [])):
        keys.add(normalize_key(alias))
    return [key for key in keys if len(key) >= 2]


def build_search_corpus(text: str) -> str:
    """Single normalized string for substring checks (handles PDF spacing issues)."""
    fixed = _fix_mojibake(text).lower()
    return normalize_key(fixed)


def find_skills_in_text(text: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    fixed = _fix_mojibake(text)
    for pattern, label in SKILL_PATTERNS:
        if re.search(pattern, fixed, flags=re.IGNORECASE):
            key = normalize_key(label)
            if key not in seen:
                seen.add(key)
                found.append(label)
    return found


def _section_chunks(job_description: str) -> list[str]:
    text = _fix_mojibake(job_description)
    lowered = text.lower()
    chunks: list[str] = []
    for header in SECTION_HEADERS:
        start = lowered.find(header)
        if start == -1:
            continue
        start += len(header)
        end = len(text)
        for marker in NEXT_SECTION_MARKERS:
            pos = lowered.find(marker, start)
            if pos != -1 and pos > start:
                end = min(end, pos)
        chunks.append(text[start:end])
    return chunks


def _skills_from_bullets(section_text: str) -> list[str]:
    skills: list[str] = []
    seen: set[str] = set()
    for raw_line in section_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line = re.sub(r"^[\-\*\u2022]\s*", "", line)
        parts = re.split(r",|;|\band\b|\bor\b", line, flags=re.IGNORECASE)
        for part in parts:
            for label in find_skills_in_text(part):
                key = normalize_key(label)
                if key in STOPWORDS or key in seen:
                    continue
                seen.add(key)
                skills.append(label)
    return skills


def extract_job_keywords(job_description: str, max_keywords: int = 24) -> list[str]:
    if not (job_description or "").strip():
        return []

    keywords: list[str] = []
    seen: set[str] = set()

    def add(label: str) -> None:
        key = normalize_key(label)
        if len(key) < 2 or key in STOPWORDS:
            return
        if key in seen:
            return
        seen.add(key)
        keywords.append(label)

    for section in _section_chunks(job_description):
        for skill in _skills_from_bullets(section):
            add(skill)
            if len(keywords) >= max_keywords:
                return keywords[:max_keywords]

    for skill in find_skills_in_text(job_description):
        add(skill)
        if len(keywords) >= max_keywords:
            break

    return _prune_keyword_list(keywords[:max_keywords])


def _prune_keyword_list(keywords: list[str]) -> list[str]:
    """Drop redundant tokens (e.g. API when REST API is present)."""
    keys = [normalize_key(keyword) for keyword in keywords]
    pruned: list[str] = []
    for keyword, key in zip(keywords, keys):
        if key in STOPWORDS:
            continue
        if key == "api" and any("rest" in other for other in keys):
            continue
        if key == "rest" and any("restapi" in other for other in keys):
            continue
        if key == "react" and any(other.startswith("react") and other != key for other in keys):
            continue
        pruned.append(keyword)
    return pruned


def keyword_matches_resume(keyword: str, resume_text: str) -> bool:
    corpus = build_search_corpus(resume_text)
    if not corpus:
        return False
    for variant in _search_variants(keyword):
        if len(variant) < 2:
            continue
        if variant in corpus:
            return True
    return False


def match_keywords_for_resume(keywords: list[str], resume_text: str) -> tuple[list[str], list[str]]:
    matched: list[str] = []
    missing: list[str] = []
    for keyword in keywords:
        if keyword_matches_resume(keyword, resume_text):
            matched.append(keyword)
        else:
            missing.append(keyword)
    return matched, missing

import { candidates } from '../data/mockData'

function hashText(text) {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function extractKeywords(jobDescription) {
  return jobDescription
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length > 2)
    .filter((token, index, arr) => arr.indexOf(token) === index)
    .slice(0, 12)
}

function scoreResume(fileName, size, keywords) {
  const entropy = hashText(`${fileName}-${size}`)
  const baseline = 62 + (entropy % 19)

  const keywordBoost = keywords.reduce((count, keyword) => {
    return count + (fileName.toLowerCase().includes(keyword) ? 1 : 0)
  }, 0)

  const score = Math.min(98, baseline + keywordBoost * 3)
  const skillsMatched = Math.max(1, Math.min(8, Math.round(score / 14)))
  const gapRisk = Math.max(6, 100 - score)

  return {
    score,
    skillsMatched,
    gapRisk
  }
}

export function generateAnalysis(jobDescription, uploadedFiles = []) {
  const normalizedDescription = jobDescription.trim()
  const keywords = extractKeywords(normalizedDescription)
  const files = uploadedFiles.length
    ? uploadedFiles
    : candidates.map((candidate, index) => ({
        name: `${candidate.name.toLowerCase().replace(/\s+/g, '_')}_resume_${index + 1}.pdf`,
        size: 120000 + index * 10000
      }))

  const rankedResumes = files
    .map((file, index) => {
      const metrics = scoreResume(file.name, file.size ?? 0, keywords)
      const confidence = Math.min(99, metrics.score + (index % 3))

      return {
        id: `${file.name}-${index}`,
        resumeName: file.name,
        score: metrics.score,
        confidence,
        skillsMatched: metrics.skillsMatched,
        gapRisk: metrics.gapRisk,
        recommendation:
          metrics.score >= 85
            ? 'Strong shortlist profile based on role alignment.'
            : metrics.score >= 75
              ? 'Promising profile with a few role-specific gaps.'
              : 'Requires deeper review for fit and technical readiness.'
      }
    })
    .sort((first, second) => second.score - first.score)

  const scoreDistribution = {
    high: rankedResumes.filter((resume) => resume.score >= 85).length,
    medium: rankedResumes.filter((resume) => resume.score >= 75 && resume.score < 85).length,
    low: rankedResumes.filter((resume) => resume.score < 75).length
  }

  const avgScore =
    rankedResumes.length > 0
      ? Math.round(
          rankedResumes.reduce((sum, resume) => sum + resume.score, 0) / rankedResumes.length
        )
      : 0

  return {
    keywords,
    rankedResumes,
    summary: {
      totalResumes: rankedResumes.length,
      avgScore,
      topScore: rankedResumes[0]?.score ?? 0,
      distribution: scoreDistribution
    }
  }
}

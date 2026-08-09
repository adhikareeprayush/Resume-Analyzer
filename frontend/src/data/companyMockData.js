export const DEMO_COMPANY = {
  id: 'co-demo',
  name: 'Northstar Labs',
  industry: 'Technology',
  size: '50–200',
  logoInitials: 'NL'
}

export const DEMO_USER = {
  id: 'usr-demo',
  companyId: DEMO_COMPANY.id,
  name: 'Anisha Shrestha',
  email: 'demo@talentlens.io',
  role: 'Talent Lead',
  password: 'demo123'
}

export const FIELD_TYPES = [
  { id: 'text', label: 'Short text', icon: 'Aa' },
  { id: 'email', label: 'Email', icon: '@' },
  { id: 'phone', label: 'Phone', icon: '☎' },
  { id: 'textarea', label: 'Long text', icon: '¶' },
  { id: 'select', label: 'Dropdown', icon: '▾' },
  { id: 'file', label: 'File upload', icon: '↑' },
  { id: 'checkbox', label: 'Checkbox', icon: '☑' }
]

export const DEFAULT_JOBS = [
  {
    id: 'job-nextjs',
    companyId: DEMO_COMPANY.id,
    title: 'Junior Next.js Developer',
    team: 'Product Engineering',
    location: 'Remote — Nepal',
    status: 'open',
    description:
      'Build and maintain web applications using Next.js and React. Collaborate with designers and backend engineers on performant, accessible UI.',
    mustHave: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    createdAt: '2026-05-12T10:00:00.000Z'
  },
  {
    id: 'job-ml',
    companyId: DEMO_COMPANY.id,
    title: 'Machine Learning Engineer',
    team: 'Applied Intelligence',
    location: 'Hybrid — Kathmandu',
    status: 'open',
    description:
      'Train and evaluate models for hiring intelligence. Ship Flask APIs and work with NLP pipelines.',
    mustHave: ['Python', 'PyTorch', 'Model Evaluation', 'Flask'],
    createdAt: '2026-05-01T10:00:00.000Z'
  }
]

export const DEFAULT_FORMS = [
  {
    id: 'form-nextjs-001',
    jobId: 'job-nextjs',
    companyId: DEMO_COMPANY.id,
    title: 'Next.js Developer Application',
    slug: 'northstar-nextjs-2026',
    isPublished: true,
    createdAt: '2026-05-14T09:00:00.000Z',
    fields: [
      { id: 'f1', type: 'text', label: 'Full name', required: true, placeholder: 'Your full name' },
      { id: 'f2', type: 'email', label: 'Email address', required: true, placeholder: 'you@email.com' },
      { id: 'f3', type: 'phone', label: 'Phone number', required: false, placeholder: '+977 ...' },
      {
        id: 'f4',
        type: 'select',
        label: 'Years of React experience',
        required: true,
        options: ['0–1 years', '1–3 years', '3+ years']
      },
      {
        id: 'f5',
        type: 'textarea',
        label: 'Why do you want to join Northstar Labs?',
        required: true,
        placeholder: 'Tell us about your motivation and relevant projects.'
      },
      { id: 'f6', type: 'file', label: 'Upload resume (PDF)', required: true, accept: '.pdf,.docx' },
      {
        id: 'f7',
        type: 'checkbox',
        label: 'I confirm the information provided is accurate',
        required: true
      }
    ]
  }
]

export const DEFAULT_SUBMISSIONS = [
  {
    id: 'sub-001',
    formId: 'form-nextjs-001',
    jobId: 'job-nextjs',
    companyId: DEMO_COMPANY.id,
    candidateName: 'Aayush Gurung',
    email: 'aayush@email.com',
    submittedAt: '2026-05-20T14:22:00.000Z',
    answers: {
      f1: 'Aayush Gurung',
      f2: 'aayush@email.com',
      f3: '+977 9841234567',
      f4: '1–3 years',
      f5: 'Built two Next.js apps with SSR and API routes.',
      f6: 'resume-aayush.pdf',
      f7: true
    }
  },
  {
    id: 'sub-002',
    formId: 'form-nextjs-001',
    jobId: 'job-nextjs',
    companyId: DEMO_COMPANY.id,
    candidateName: 'Sabina Magar',
    email: 'sabina@email.com',
    submittedAt: '2026-05-21T09:10:00.000Z',
    answers: {
      f1: 'Sabina Magar',
      f2: 'sabina@email.com',
      f4: '3+ years',
      f5: 'Led frontend for a B2B SaaS dashboard.',
      f6: 'sabina-cv.pdf',
      f7: true
    }
  }
]

export const LANDING_STATS = [
  { label: 'Companies onboarded', value: '120+' },
  { label: 'Applications processed', value: '18k' },
  { label: 'Avg. time to shortlist', value: '2.4 days' },
  { label: 'Model match accuracy', value: '87%' }
]

export const LANDING_FEATURES = [
  {
    title: 'Custom application forms',
    detail: 'Design role-specific forms with file uploads, screening questions, and branded share links.'
  },
  {
    title: 'AI resume ranking',
    detail: 'Score every applicant against your job description with explainable fit labels and skill coverage.'
  },
  {
    title: 'Recruiter dashboard',
    detail: 'Track jobs, submissions, and shortlist candidates from one workspace built for hiring teams.'
  }
]

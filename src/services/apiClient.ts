const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api/v1').replace(/\/+$/, '');

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (typeof sessionStorage !== 'undefined') {
    const token = sessionStorage.getItem('candidate_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function loginAPI(email: string, password?: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Failed to log in');
  return res.json();
}

export async function registerAPI(email: string, fullName: string, password?: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, full_name: fullName, password })
  });
  if (!res.ok) throw new Error('Failed to register');
  return res.json();
}

export async function fetchCurrentUserAPI() {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const rootUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const res = await fetch(`${rootUrl}/healthcheck`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchProfileAPI(profileId: string = 'prof-1') {
  const res = await fetch(`${API_BASE_URL}/vault/profile/${profileId}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function ingestTextAPI(rawText: string, profileId: string = 'prof-1') {
  const res = await fetch(`${API_BASE_URL}/vault/ingest/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: profileId, raw_text: rawText })
  });
  if (!res.ok) throw new Error('Failed to ingest text');
  return res.json();
}

export async function deconstructJobAPI(title: string, company: string, rawDescription: string) {
  const res = await fetch(`${API_BASE_URL}/jobs/deconstruct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: 'prof-1', title, company, raw_description: rawDescription })
  });
  if (!res.ok) throw new Error('Failed to deconstruct target JD');
  return res.json();
}

export async function deconstructJobURLAPI(url: string) {
  const res = await fetch(`${API_BASE_URL}/jobs/deconstruct-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: 'prof-1', url })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch and deconstruct job URL');
  }
  return res.json();
}

export async function updateJobStateAPI(jobId: string, stateUpdate: {
  current_step?: number;
  status?: string;
  selected_theme?: string;
  ats_score?: number;
  tailored_resume_payload?: any;
}) {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stateUpdate)
  });
  if (!res.ok) throw new Error('Failed to update job application state');
  return res.json();
}

export async function fetchApplicationsHistoryAPI(statusFilter?: string) {
  const url = statusFilter ? `${API_BASE_URL}/jobs/?status_filter=${statusFilter}` : `${API_BASE_URL}/jobs/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch job applications history');
  return res.json();
}

export async function analyzeGapsAPI(jobId: string) {
  const res = await fetch(`${API_BASE_URL}/jobs/analyze-gaps/${jobId}`);
  if (!res.ok) throw new Error('Failed to analyze gaps');
  return res.json();
}

export async function startElicitationAPI(targetJobId: string, gapRequirement: string) {
  const res = await fetch(`${API_BASE_URL}/interviews/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_job_id: targetJobId, gap_requirement: gapRequirement })
  });
  if (!res.ok) throw new Error('Failed to start elicitation session');
  return res.json();
}

export async function submitAnswerAPI(sessionId: string, userResponse: string) {
  const res = await fetch(`${API_BASE_URL}/interviews/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, user_response: userResponse })
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

export async function commitXYZBulletAPI(sessionId: string) {
  const res = await fetch(`${API_BASE_URL}/interviews/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  if (!res.ok) throw new Error('Failed to commit XYZ bullet');
  return res.json();
}

export async function auditATSAPI(resumeData: any, jobDescription?: string) {
  const res = await fetch(`${API_BASE_URL}/exporter/ats-audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_data: resumeData, job_description: jobDescription || '' })
  });
  if (!res.ok) throw new Error('Failed to perform ATS Audit');
  return res.json();
}

export async function exportDocxAPI(resumeData: any): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/exporter/export-docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_data: resumeData })
  });
  if (!res.ok) throw new Error('Failed to generate DOCX');
  return res.blob();
}

export async function exportPdfAPI(resumeData: any): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/exporter/export-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_data: resumeData })
  });
  if (!res.ok) throw new Error('Failed to generate PDF');
  return res.blob();
}

export async function generateMockInterviewSessionAPI(jobTitle?: string, company?: string, responsibilities?: string[]) {
  const res = await fetch(`${API_BASE_URL}/coach/generate-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_title: jobTitle || 'Target Engineer',
      company: company || 'Target Employer',
      responsibilities: responsibilities || []
    })
  });
  if (!res.ok) throw new Error('Failed to generate mock interview session');
  return res.json();
}

export async function evaluateSimulatedAnswerAPI(question: string, candidateAnswer: string, targetJobTitle?: string) {
  const res = await fetch(`${API_BASE_URL}/coach/evaluate-simulated-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      candidate_answer: candidateAnswer,
      target_job_title: targetJobTitle || 'Target Role'
    })
  });
  if (!res.ok) throw new Error('Failed to evaluate simulated answer');
  return res.json();
}


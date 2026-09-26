/**
 * Unescapes HTML entities, removes leading double-bullet/bar artifacts, and trims whitespace.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;

  // Unescape standard HTML entities (&amp;, &#39;, &quot;, &lt;, &gt;, etc.)
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

  // Remove leading bullet symbols, pipe bars, or thick unicode blocks (▍, •, -, *, |)
  cleaned = cleaned.replace(/^[•\-*|\▍\s]+/, '').trim();

  // Remove redundant trailing or repeated pipe bars
  cleaned = cleaned.replace(/\s+\|\s+\|/g, ' |');

  return cleaned;
}

/**
 * Proofreads and polishes spelling, grammar, and proper noun capitalization for career bullets.
 */
export function spellCheckAndPolishBullet(text: string): string {
  if (!text) return '';
  let polished = sanitizeText(text);

  // Common spelling corrections map
  const typoCorrections: [RegExp, string][] = [
    [/\bproffesional\b/gi, 'professional'],
    [/\brecomended\b/gi, 'recommended'],
    [/\bachived\b/gi, 'achieved'],
    [/\bmanagment\b/gi, 'management'],
    [/\bdevlopment\b/gi, 'development'],
    [/\bopportunites\b/gi, 'opportunities'],
    [/\bresponsiblity\b/gi, 'responsibility'],
    [/\bimplementd\b/gi, 'implemented'],
    [/\bleaded\b/gi, 'led'],
    [/\borganizational\b/gi, 'organizational'],
    [/\binitiatives\b/gi, 'initiatives']
  ];

  for (const [regex, replacement] of typoCorrections) {
    polished = polished.replace(regex, replacement);
  }

  // Proper Noun & Tech Capitalization Map
  const properNouns: [RegExp, string][] = [
    [/\bworkday\b/gi, 'Workday'],
    [/\bgreenhouse\b/gi, 'Greenhouse'],
    [/\blever\b/gi, 'Lever'],
    [/\blatam\b/gi, 'LATAM'],
    [/\bfastapi\b/gi, 'FastAPI'],
    [/\bpgvector\b/gi, 'pgvector'],
    [/\bswe\b/gi, 'SWE'],
    [/\bsoc2\b/gi, 'SOC2'],
    [/\baws\b/gi, 'AWS'],
    [/\bcrm\b/gi, 'CRM'],
    [/\bats\b/gi, 'ATS'],
    [/\brbac\b/gi, 'RBAC'],
    [/\bsla\b/gi, 'SLA'],
    [/\bkpi\b/gi, 'KPI'],
    [/\bkpis\b/gi, 'KPIs'],
    [/\bths\b/gi, 'THS'],
    [/\bcorp eng\b/gi, 'Corp Eng']
  ];

  for (const [regex, replacement] of properNouns) {
    polished = polished.replace(regex, replacement);
  }

  // Ensure first character is capitalized
  if (polished.length > 0) {
    polished = polished.charAt(0).toUpperCase() + polished.slice(1);
  }

  // Ensure sentence ends with period if it's a complete sentence bullet
  if (polished.length > 15 && !/[.!?]$/.test(polished)) {
    polished += '.';
  }

  return polished;
}

/**
 * Filter out header duplicates (e.g. role title header repeated as bullet text).
 */
export function isHeaderDuplicate(bulletText: string, roleTitle?: string, company?: string): boolean {
  if (!bulletText) return true;
  const clean = sanitizeText(bulletText).toLowerCase();
  
  if (roleTitle && clean.includes(roleTitle.toLowerCase()) && clean.includes('present')) {
    return true;
  }
  if (company && clean.includes(company.toLowerCase()) && clean.includes('present')) {
    return true;
  }
  
  // If line looks like a header (e.g. "Role Title | Company • Dates")
  if (clean.includes('|') && (clean.includes('present') || /\b\d{4}\b/.test(clean))) {
    return true;
  }

  return false;
}

"""
Job Posting URL Scraper & Company Intelligence Engine
Fetches job posting web pages, extracts clean job descriptions,
and analyzes company mission, values, and strategic first-impression hooks.
"""

import re
import json
from typing import Dict, Any
import httpx
from bs4 import BeautifulSoup
from app.services.llm_client import LLMClient
from app.services.match_engine import MatchEngine


class JobScraperEngine:
    @staticmethod
    def scrape_url_text(url: str) -> str:
        """
        Fetches web page content from a URL and extracts readable body text.
        """
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                html = response.text
        except Exception as e:
            raise ValueError(f"Could not fetch content from URL: {str(e)}")

        soup = BeautifulSoup(html, "html.parser")

        # Remove non-content tags
        for element in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "form"]):
            element.extract()

        # Get text
        text = soup.get_text(separator="\n")
        
        # Clean extra whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = "\n".join(lines)
        
        return clean_text

    @staticmethod
    def deconstruct_job_url(url: str) -> Dict[str, Any]:
        """
        Scrapes a job posting URL, parses job requirements, and generates company intelligence insights.
        """
        raw_text = JobScraperEngine.scrape_url_text(url)

        # Remove common sign-in and page navigation boilerplate lines
        ignore_patterns = [
            "skip to main content", "join or sign in to find your next job", "sign in to view",
            "linkedin user agreement", "privacy policy", "cookie policy", "copyright", "all rights reserved"
        ]
        clean_lines = [l for l in raw_text.splitlines() if not any(ip in l.lower() for ip in ignore_patterns)]
        clean_text = "\n".join(clean_lines)
        
        # 1. Parse JD attributes using MatchEngine
        parsed_jd = MatchEngine.deconstruct_job_description(clean_text[:4000])

        # 2. Extract company name and job title from text or URL heuristics if missing
        company_name = parsed_jd.get("company", "").strip()
        job_title = parsed_jd.get("title", "").strip()

        # Check URL path slug for title and company (e.g. manager-recruiting-sales-at-figma or role-at-company)
        slug_match = re.search(r'/view/([a-zA-Z0-9-]+)', url) or re.search(r'([a-zA-Z0-9-]+(?:-at-|-role-)[a-zA-Z0-9-]+)', url)
        if slug_match:
            slug = re.sub(r'-\d+$', '', slug_match.group(1)).replace('-', ' ')
            if " at " in slug.lower():
                parts = re.split(r'\s+at\s+', slug, flags=re.IGNORECASE)
                job_title = parts[0].title()
                company_name = parts[1].title()
            else:
                job_title = slug.title()

        if not company_name or company_name == "Target Company":
            # Search first few lines for "at <Company>" or domain
            domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
            if domain_match:
                domain = domain_match.group(1).split('.')[0]
                if domain not in {"greenhouse", "lever", "workday", "linkedin", "indeed", "glassdoor", "jobs"}:
                    company_name = domain.capitalize()
                else:
                    company_name = "Target Company"
            else:
                company_name = "Target Company"

        if not job_title or job_title == "Target Role":
            # Search first 5 lines of cleaned text for title keywords
            for line in clean_lines[:5]:
                if any(w in line.lower() for w in ["manager", "lead", "director", "recruiting", "engineer", "specialist", "sales", "executive", "head", "vp"]):
                    if len(line) < 60 and not "sign in" in line.lower():
                        job_title = line
                        break

        if not job_title:
            job_title = "Target Role"

        # 1. Parse JD attributes using MatchEngine with title context
        parsed_jd = MatchEngine.deconstruct_job_description(f"{job_title} at {company_name}\n\n{clean_text[:4000]}")

        # 3. Generate Company Intelligence Report using LLM or structured heuristics
        company_intel = JobScraperEngine.analyze_company_intelligence(company_name, clean_text)

        return {
            "url": url,
            "title": job_title,
            "company": company_name,
            "location": parsed_jd.get("location") or "Remote / Hybrid",
            "raw_description": clean_text[:3000] if clean_text else raw_text[:3000],
            "parsed_hard_skills": parsed_jd.get("parsed_hard_skills", []),
            "parsed_soft_skills": parsed_jd.get("parsed_soft_skills", []),
            "parsed_responsibilities": parsed_jd.get("parsed_responsibilities", []),
            "parsed_metrics": parsed_jd.get("parsed_metrics", []),
            "company_intelligence": company_intel
        }

    @staticmethod
    def analyze_company_intelligence(company_name: str, raw_text: str) -> Dict[str, Any]:
        """
        Generates company mission, values, culture notes, and first-impression hooks.
        """
        prompt = f"""
Analyze the following job description text for company "{company_name}".
Extract or synthesize key company intelligence to help a candidate make a stellar first impression.

Return ONLY a JSON object with:
{{
  "mission_statement": "Core mission and strategic focus",
  "core_values": ["Value 1", "Value 2", "Value 3"],
  "culture_insights": "Engineering culture and operational environment notes",
  "first_impression_hooks": [
    "Hook 1: How to align past achievements with company goals",
    "Hook 2: Key value/culture trait to reference in cover letter",
    "Hook 3: Strategic question to ask during interviews"
  ]
}}

Job Posting Content:
{raw_text[:2500]}
"""

        try:
            raw_response = LLMClient.chat_completion(
                system_prompt="You are an expert executive talent recruiter and company intelligence analyst.",
                user_prompt=prompt,
                response_format_json=True
            )
            result = json.loads(raw_response)
        except Exception:
            result = None

        if not result or not isinstance(result, dict) or "mission_statement" not in result:
            # Fallback intelligence
            result = {
                "mission_statement": f"Empowering enterprise customers through high-throughput technology and modern products.",
                "core_values": ["Innovation & Speed", "Customer Success", "Technical Rigor"],
                "culture_insights": "Fast-paced environment emphasizing technical ownership, data-driven decisions, and collaboration.",
                "first_impression_hooks": [
                    f"Emphasize quantified performance impact and system scalability in your intro.",
                    f"Reference commitment to high-quality technical standards and test automation.",
                    f"Ask how the team approaches architectural evolution as product scale doubles."
                ]
            }

        return result

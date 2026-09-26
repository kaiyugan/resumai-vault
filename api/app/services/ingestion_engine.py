import re
import json
from typing import Dict, Any, List
from io import BytesIO
from app.services.llm_client import LLMClient

class IngestionEngine:
    """
    Ingestion Engine: Extracts plain text from unstructured files (PDF, DOCX, LinkedIn paste)
    and executes LLM entity extraction into structured Master Vault records with 1536D vector embeddings.
    """

    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        try:
            from pypdf import PdfReader
            reader = PdfReader(BytesIO(pdf_bytes))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text.strip()
        except Exception as e:
            return f"Error extracting PDF: {str(e)}"

    @staticmethod
    def extract_text_from_docx(docx_bytes: bytes) -> str:
        try:
            from docx import Document
            doc = Document(BytesIO(docx_bytes))
            text = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(text)
        except Exception as e:
            return f"Error extracting DOCX: {str(e)}"

    @staticmethod
    def parse_entities_with_llm(raw_text: str) -> Dict[str, Any]:
        """
        Runs structured LLM entity extraction to split raw career text into
        candidate profile, multiple work experiences, bullet points, skills, and education.
        Includes a robust multi-experience heuristic fallback parser when LLM is unavailable.
        """
        system_prompt = (
            "You are an expert ATS Career Entity Extraction Engine. Analyze the user's raw career text "
            "and extract candidate profile metadata, multiple work experiences, achievement bullet points, skills, and education. "
            "Respond ONLY with a valid JSON object matching this structure:\n"
            "{\n"
            '  "profile": {"name": str, "title": str, "email": str, "phone": str, "location": str, "linkedin": str, "summary": str},\n'
            '  "experiences": [{"company": str, "role_title": str, "location": str, "start_date": str, "end_date": str, "is_current": bool, "raw_summary": str, "bullets": [str], "skills_used": [str]}],\n'
            '  "skills": [str],\n'
            '  "education": [{"degree": str, "field_of_study": str, "institution": str, "location": str, "start_date": str, "end_date": str, "gpa": str}]\n'
            "}"
        )

        try:
            llm_raw_response = LLMClient.chat_completion(
                system_prompt=system_prompt,
                user_prompt=raw_text[:3500],
                response_format_json=True
            )
            parsed_json = json.loads(llm_raw_response)
        except Exception:
            parsed_json = {}

        parsed_profile = parsed_json.get("profile", {})
        raw_experiences = parsed_json.get("experiences", [])
        extracted_skills = parsed_json.get("skills", [])
        extracted_education = parsed_json.get("education", [])

        # HEURISTIC FALLBACK PARSING if LLM didn't return complete experiences
        if not raw_experiences:
            lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
            
            # Contact & Profile Extraction
            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text)
            phone_match = re.search(r'\+?\d[\d\s\-()]{8,}', raw_text)
            linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', raw_text, re.I)

            name = lines[0] if lines and len(lines[0]) < 40 and not "@" in lines[0] else "Candidate Name"
            email = email_match.group(0) if email_match else "candidate@example.com"
            phone = phone_match.group(0) if phone_match else "(555) 000-0000"
            linkedin = linkedin_match.group(0) if linkedin_match else "linkedin.com/in/candidate"
            location = "City, State"

            # Search for title in first 10 lines
            candidate_title = "Career Professional"
            for l in lines[:10]:
                if any(w in l.lower() for w in ["manager", "lead", "director", "engineer", "recruiting", "specialist", "architect", "consultant", "head", "vp"]):
                    if len(l) < 60 and not "@" in l and not "experience" in l.lower():
                        candidate_title = l
                        break

            # Search for Executive Summary
            summary_text = ""
            summary_idx = -1
            for i, line in enumerate(lines[:15]):
                if "SUMMARY" in line.upper() or "PROFILE" in line.upper() or "ABOUT" in line.upper():
                    summary_idx = i
                    break
            if summary_idx != -1 and summary_idx + 1 < len(lines):
                summary_text = lines[summary_idx + 1]

            # Section splitting for Experiences
            exp_section_lines = []
            in_exp_section = False
            for line in lines:
                upper = line.upper()
                if any(h in upper for h in ["EXPERIENCE", "WORK HISTORY", "EMPLOYMENT", "CAREER HISTORY"]):
                    in_exp_section = True
                    continue
                if in_exp_section and any(h in upper for h in ["EDUCATION", "SKILLS", "CERTIFICATIONS", "PROJECTS"]):
                    in_exp_section = False
                if in_exp_section:
                    exp_section_lines.append(line)

            if not exp_section_lines:
                exp_section_lines = lines

            # Detect multiple experience blocks by headers or date patterns
            parsed_blocks = []
            current_block = None

            date_pattern = re.compile(r'(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b.*?(?:Present|\d{4}))', re.I)

            for line in exp_section_lines:
                has_date = date_pattern.search(line)
                is_header_candidate = (
                    "|" in line or
                    "-" in line or
                    any(w in line.lower() for w in ["manager", "lead", "engineer", "director", "staffing", "recruiting", "consultant", "analyst", "developer", "specialist", "coordinator"])
                )

                if (has_date or (is_header_candidate and not line.startswith("•") and not line.startswith("-"))) and len(line) < 100:
                    if current_block and (current_block["role_title"] or current_block["bullets"]):
                        parsed_blocks.append(current_block)

                    # Split header into role and company
                    parts = [p.strip() for p in re.split(r'[|•–-]', line) if p.strip()]
                    role = parts[0] if parts else "Role Title"
                    company = parts[1] if len(parts) > 1 else "Company"

                    dates = has_date.group(0) if has_date else "2022 – Present"

                    current_block = {
                        "company": company,
                        "role_title": role,
                        "location": "Remote / Hybrid",
                        "start_date": dates.split("–")[0].strip() if "–" in dates else "2022-01-01",
                        "end_date": "Present" if "present" in dates.lower() else "2024-01-01",
                        "is_current": "present" in dates.lower(),
                        "raw_summary": line,
                        "bullets": [],
                        "skills_used": []
                    }
                elif current_block:
                    if len(line) > 15:
                        current_block["bullets"].append(line.lstrip("•-* "))
                else:
                    # First fallback block if no header reached yet
                    current_block = {
                        "company": "Primary Organization",
                        "role_title": candidate_title,
                        "location": "City, State",
                        "start_date": "2022-01-01",
                        "end_date": "Present",
                        "is_current": True,
                        "raw_summary": "Ingested Experience Record",
                        "bullets": [line.lstrip("•-* ")] if len(line) > 15 else [],
                        "skills_used": []
                    }

            if current_block and (current_block["role_title"] or current_block["bullets"]):
                parsed_blocks.append(current_block)

            raw_experiences = parsed_blocks if parsed_blocks else [{
                "company": "Ingested Career History",
                "role_title": candidate_title,
                "location": "City, State",
                "start_date": "2022-01-01",
                "end_date": "Present",
                "is_current": True,
                "raw_summary": "Extracted Career Experience",
                "bullets": [l.lstrip("•-* ") for l in lines if len(l) > 20][:8],
                "skills_used": []
            }]

            parsed_profile = {
                "name": name,
                "title": candidate_title,
                "email": email,
                "phone": phone,
                "location": location,
                "linkedin": linkedin,
                "summary": summary_text or f"Experienced {candidate_title} with a proven track record of driving strategic initiatives, optimizing organizational workflows, and delivering high-impact business outcomes."
            }

            # Heuristic skill extraction (both tech & business)
            common_skills = [
                "Recruiting Strategy", "Technical Staffing", "Talent Acquisition", "LATAM Expansion", "Team Leadership",
                "Pipeline Management", "Workday", "Greenhouse", "Sourcing", "TypeScript", "JavaScript", "Python",
                "Next.js", "React", "FastAPI", "PostgreSQL", "AWS", "Docker", "Kubernetes", "GraphQL", "Tailwind CSS",
                "Cross-functional Leadership", "Stakeholder Management", "Strategic Hiring", "Performance Optimization"
            ]
            extracted_skills = [s for s in common_skills if s.lower() in raw_text.lower()]
            if not extracted_skills:
                extracted_skills = ["Technical Staffing", "Recruiting Strategy", "Team Leadership", "Pipeline Management", "Stakeholder Alignment"]

        # Convert experiences & bullets into database records
        formatted_experiences = []
        formatted_achievements = []

        for i, exp in enumerate(raw_experiences):
            exp_id = f"exp-ingest-{i+1}"
            bullets = exp.get("bullets", [])
            if not bullets and exp.get("raw_summary"):
                bullets = [exp["raw_summary"]]

            formatted_experiences.append({
                "id": exp_id,
                "company": exp.get("company", "Company"),
                "role_title": exp.get("role_title", "Role"),
                "location": exp.get("location", "Remote / Hybrid"),
                "start_date": exp.get("start_date", "2022-01-01"),
                "end_date": exp.get("end_date", "Present"),
                "is_current": exp.get("is_current", True),
                "raw_summary": exp.get("raw_summary", ""),
                "skills_used": exp.get("skills_used", extracted_skills[:4])
            })

            for j, b_text in enumerate(bullets):
                clean_bullet = b_text.lstrip("•-* ")
                has_metric = bool(re.search(r'(\d+%\s|\d+x\s|\$\d+|\b\d+\s*ms\b|\b\d+\b)', clean_bullet, re.IGNORECASE))
                metric_match = re.search(r'(\d+%\s*[\w\s]+|\d+x\s*[\w\s]+|\$\d+[\w\s]+|\b\d+\s*[\w\s]+)', clean_bullet, re.IGNORECASE)
                metric_val = metric_match.group(0).strip() if metric_match else ("Verified Metric" if has_metric else None)

                formatted_achievements.append({
                    "id": f"ach-ingest-{i+1}-{j+1}",
                    "experience_id": exp_id,
                    "raw_bullet": clean_bullet,
                    "quantified_metric": {"value": metric_val} if metric_val else {},
                    "action_verb": clean_bullet.split(" ")[0] if clean_bullet else "Achieved",
                    "context": f"Career history bullet at {exp.get('company')}",
                    "vector_tags": ["Ingested Resume", exp.get("company", "Career Vault")]
                })

        # Generate embeddings
        for exp in formatted_experiences:
            summary_text = f"{exp.get('role_title', '')} {exp.get('company', '')} {exp.get('raw_summary', '')}"
            exp["embedding"] = LLMClient.generate_embedding(summary_text)

        for ach in formatted_achievements:
            bullet_text = ach.get("raw_bullet", "")
            ach["embedding"] = LLMClient.generate_embedding(bullet_text)

        return {
            "experiences": formatted_experiences,
            "achievements": formatted_achievements,
            "parsed_data": {
                "profile": parsed_profile,
                "experiences": formatted_experiences,
                "achievements": formatted_achievements,
                "skills": extracted_skills,
                "education": extracted_education
            }
        }


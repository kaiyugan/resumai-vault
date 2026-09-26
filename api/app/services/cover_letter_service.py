import json
from typing import List, Dict, Any
from app.services.llm_client import LLMClient

class CoverLetterService:
    """
    Tailored Cover Letter Generator Service.
    Synthesizes role-specific cover letters using candidate Master Vault Google XYZ achievements
    and target JD weights across multiple tone presets.
    """

    @staticmethod
    def generate_cover_letter(
        profile_name: str,
        profile_title: str,
        company_name: str,
        job_title: str,
        top_achievements: List[str],
        tone: str = "Technical Architect"
    ) -> Dict[str, Any]:
        """
        Synthesizes a 3-paragraph tailored cover letter matching target JD requirements.
        """
        system_prompt = (
            "You are an Executive Resume & Cover Letter Writer. Write a 3-paragraph tailored cover letter "
            "synthesizing the candidate's top Google XYZ achievements. Respond ONLY with valid JSON in this structure:\n"
            "{\n"
            '  "opening_paragraph": str,\n'
            '  "core_paragraph": str,\n'
            '  "closing_paragraph": str,\n'
            '  "full_text": str\n'
            "}"
        )

        user_prompt = (
            f"Candidate: {profile_name}, {profile_title}\n"
            f"Target Role: {job_title} at {company_name}\n"
            f"Tone: {tone}\n"
            f"Achievements: {json.dumps(top_achievements)}"
        )

        if LLMClient.is_openai_available():
            try:
                resp = LLMClient.chat_completion(system_prompt, user_prompt, response_format_json=True)
                parsed = json.loads(resp)
                if "opening_paragraph" in parsed:
                    return parsed
            except Exception:
                pass

        # Smart Fallback Cover Letter Synthesizer
        ach_text = top_achievements[0] if top_achievements else "Optimized system response throughput by 42% using Next.js and FastAPI."

        opening = (
            f"Dear Hiring Team at {company_name},\n\n"
            f"I am writing to express my strong interest in the {job_title} position. "
            f"With a proven track record as a {profile_title}, I have consistently focused on architecting "
            f"scalable, high-performance systems that align directly with {company_name}'s technical roadmap and growth goals."
        )

        if tone == "Executive":
            core = (
                f"Throughout my career, I have prioritized driving measurable organization-wide impact. For instance, "
                f"{ach_text} By establishing technical standards and leading cross-functional engineering teams, "
                f"I have reliably accelerated feature delivery velocity while maintaining sub-100ms system latency constraints."
            )
        elif tone == "Product Leader":
            core = (
                f"My engineering philosophy centers on delivering exceptional user engagement and product velocity. "
                f"In my previous work, {ach_text} I thrive on translating complex business objectives into intuitive, "
                f"high-throughput user interfaces that drive retention and user satisfaction."
            )
        elif tone == "Confident Innovator":
            core = (
                f"I bring a relentless drive for innovation and engineering excellence. Most recently, "
                f"{ach_text} I am passionate about tackling complex AI and vector architecture challenges, "
                f"and I am excited to bring this energetic momentum to the engineering team at {company_name}."
            )
        else: # Technical Architect
            core = (
                f"My technical background is rooted in deep system architecture and performance optimization. Specifically, "
                f"{ach_text} My expertise spans Next.js App Router, FastAPI backends, PostgreSQL pgvector indexing, "
                f"and automated CI/CD pipelines designed for 100% compliance and reliability."
            )

        closing = (
            f"I am eager to discuss how my background and verified metrics align with the goals for the {job_title} role. "
            f"Thank you for your time and consideration, and I look forward to the opportunity to connect.\n\n"
            f"Sincerely,\n{profile_name}"
        )

        full_text = f"{opening}\n\n{core}\n\n{closing}"

        return {
            "opening_paragraph": opening,
            "core_paragraph": core,
            "closing_paragraph": closing,
            "full_text": full_text,
            "tone_used": tone
        }

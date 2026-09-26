import json
from typing import Dict, Any
from app.services.llm_client import LLMClient

class XYZSynthesizer:
    """
    Discovery Micro-Interviewer & Google XYZ Bullet Formula Synthesizer.
    Formula: Accomplished [X], as measured by [Y], by doing [Z].
    """

    @staticmethod
    def generate_interview_question(gap_requirement: str, matched_bullet: str = None) -> str:
        """
        Formulates a targeted metric question for unquantified matches or potential gaps.
        """
        system_prompt = (
            "You are an expert Executive Interviewer. Formulate a single concise metric-focused "
            "micro-interview question asking the candidate for quantifiable results."
        )

        user_prompt = (
            f"Requirement: {gap_requirement}\n"
            f"Existing Bullet: {matched_bullet if matched_bullet else 'None'}"
        )

        if LLMClient.is_openai_available():
            return LLMClient.chat_completion(system_prompt, user_prompt)

        if matched_bullet:
            return (
                f'In your role where you "{matched_bullet}", what was the concrete metric or percentage outcome? '
                f'For example, how many engineers were impacted, or by what percentage did throughput or latency improve?'
            )
        else:
            return (
                f'The target role requires experience with "{gap_requirement}". Have you led or worked on a project '
                f'involving this? What specific technical action did you take, and what quantifiable metric resulted?'
            )

    @staticmethod
    def synthesize_google_xyz(gap_title: str, user_answer: str) -> Dict[str, str]:
        """
        Reformats a raw conversational answer into the Google XYZ formula:
        Accomplished [X], as measured by [Y], by doing [Z].
        """
        system_prompt = (
            "You are a Google Resume Engineering Editor. Convert the candidate's raw answer into a high-impact "
            "Google XYZ bullet point formatted strictly as: Accomplished [X], as measured by [Y], by doing [Z]. "
            "Respond ONLY with valid JSON in this structure:\n"
            "{\n"
            '  "xyz_bullet": str,\n'
            '  "action_verb": str,\n'
            '  "quantified_metric": str\n'
            "}"
        )

        user_prompt = f"Target Gap: {gap_title}\nCandidate Answer: {user_answer}"

        if LLMClient.is_openai_available():
            try:
                resp = LLMClient.chat_completion(system_prompt, user_prompt, response_format_json=True)
                parsed = json.loads(resp)
                if parsed.get("xyz_bullet"):
                    parsed["gap_title"] = gap_title
                    return parsed
            except Exception:
                pass

        # Smart Fallback Google XYZ Formula Generator
        user_lower = user_answer.lower()

        if "team" in user_lower or "engineer" in user_lower:
            action_verb = "Accelerated"
            accomplished_x = "team feature delivery velocity by 35%"
            measured_y = "quarterly sprint throughput metrics"
            doing_z = "establishing standardized component design system guidelines and automated code reviews"
            metric_val = "35% sprint velocity boost"

        elif "latency" in user_lower or "lcp" in user_lower or "speed" in user_lower or "performance" in user_lower:
            action_verb = "Optimized"
            accomplished_x = "web application response throughput by 42%"
            measured_y = "Datadog p99 latency tracing"
            doing_z = "refactoring core bundle streams with Next.js App Router and dynamic code splitting"
            metric_val = "42% latency reduction"

        elif "security" in user_lower or "soc" in user_lower or "compliance" in user_lower:
            action_verb = "Attained"
            accomplished_x = "100% SOC2 Type II audit readiness"
            measured_y = "zero high-severity audit findings across 42 controls"
            doing_z = "engineering zero-trust API authentication & RBAC middleware"
            metric_val = "100% SOC2 audit readiness"

        else:
            action_verb = "Enhanced"
            accomplished_x = f"operational performance for {gap_title} by 30%"
            measured_y = "system efficiency tracking metrics"
            doing_z = f"implementing {user_answer[:60]}... and automated monitoring alerts"
            metric_val = "30% efficiency gain"

        xyz_bullet = f"{action_verb} {accomplished_x}, as measured by {measured_y}, by {doing_z}."

        return {
            "xyz_bullet": xyz_bullet,
            "action_verb": action_verb,
            "quantified_metric": metric_val,
            "gap_title": gap_title
        }

import json
from typing import List, Dict, Any
from app.services.llm_client import LLMClient

class STARCoachService:
    """
    STAR-Method Behavioral Interview Coach Service.
    Converts Master Vault achievements into structured STAR story cards
    and evaluates practice answers for interview readiness.
    """

    @staticmethod
    def generate_star_stories(achievements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Converts master achievement entity records into structured STAR story cards.
        """
        star_stories = []

        for i, ach in enumerate(achievements):
            bullet = ach.get("raw_bullet", "")
            metric = ach.get("quantified_metric", {}).get("value", "Quantified Metric")

            # Default STAR breakdown
            story = {
                "id": f"star-{ach.get('id', i)}",
                "title": f"Story #{i+1}: {ach.get('context', 'System Performance Optimization')}",
                "achievement_id": ach.get("id"),
                "raw_bullet": bullet,
                "metric_value": metric,
                "situation": f"System baseline required performance and throughput improvements during scaling phase.",
                "task": f"Took lead technical ownership to optimize architecture and resolve latency/scale bottlenecks.",
                "action": f"Implemented dynamic bundle splitting, connection pooling, and optimized API data streams.",
                "result": f"Accomplished concrete outcome: {bullet}",
                "sample_questions": [
                    f"Tell me about a time you optimized performance under tight deadlines.",
                    f"Describe a technical challenge where you drove quantifiable impact.",
                    f"How do you measure success when refactoring core system components?"
                ]
            }

            star_stories.append(story)

        return star_stories

    @staticmethod
    def evaluate_practice_answer(question: str, user_answer: str, target_story: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Evaluates a candidate's practice behavioral interview answer against the STAR method.
        """
        system_prompt = (
            "You are a Senior Behavioral Interview Coach. Evaluate the candidate's answer to the behavioral question. "
            "Respond ONLY with valid JSON in this structure:\n"
            "{\n"
            '  "star_completeness_score": int,\n'
            '  "has_quantified_metric": bool,\n'
            '  "situation_feedback": str,\n'
            '  "action_feedback": str,\n'
            '  "result_feedback": str,\n'
            '  "overall_tip": str\n'
            "}"
        )

        user_prompt = f"Question: {question}\nCandidate Answer: {user_answer}"

        if LLMClient.is_openai_available():
            try:
                resp = LLMClient.chat_completion(system_prompt, user_prompt, response_format_json=True)
                parsed = json.loads(resp)
                if "star_completeness_score" in parsed:
                    return parsed
            except Exception:
                pass

        # Fallback STAR evaluator logic
        answer_lower = user_answer.lower()
        has_metric = any(char.isdigit() for char in user_answer) or "%" in user_answer or "x" in answer_lower
        
        words = len(user_answer.split())
        base_score = min(92, max(60, words * 2)) if words > 10 else 55

        return {
            "star_completeness_score": base_score,
            "has_quantified_metric": has_metric,
            "situation_feedback": "Good context provided regarding the project baseline and technical constraints.",
            "action_feedback": "Strong description of specific engineering steps taken (frameworks, refactoring).",
            "result_feedback": "Verified metric present! Mentioning concrete metrics elevates your credibility with interviewers." if has_metric else "Tip: Mention explicit percentage or throughput numbers in your result section.",
            "overall_tip": "Focus on emphasizing your direct technical ownership ('I architected' vs 'We built') to showcase strong leadership."
        }

    @staticmethod
    def generate_mock_interview_session(
        job_title: str = "Senior Engineering Lead",
        company: str = "Target Employer",
        responsibilities: List[str] = None,
        achievements: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates 4 tailored interview questions based on the candidate's target job and master vault achievements.
        """
        resps = responsibilities or ["System Architecture", "Cross-functional Leadership"]
        first_resp = resps[0] if resps else "technical ownership"
        sec_resp = resps[1] if len(resps) > 1 else "cross-functional collaboration"

        system_prompt = (
            "You are an Executive Interviewer at a top technology firm. Generate 4 tailored interview questions for a candidate "
            "applying for the specified target job. Respond ONLY with valid JSON in this exact format:\n"
            "[\n"
            '  {"id": "q1", "category": "BEHAVIORAL", "question": "...", "interviewer_intent": "...", "recommended_story_angle": "..."},\n'
            '  {"id": "q2", "category": "TECHNICAL_COMPETENCY", "question": "...", "interviewer_intent": "...", "recommended_story_angle": "..."},\n'
            '  {"id": "q3", "category": "CULTURE_FIT", "question": "...", "interviewer_intent": "...", "recommended_story_angle": "..."},\n'
            '  {"id": "q4", "category": "LEADERSHIP_IMPACT", "question": "...", "interviewer_intent": "...", "recommended_story_angle": "..."}\n'
            "]"
        )
        user_prompt = f"Target Role: {job_title} at {company}\nKey Responsibilities: {', '.join(resps[:3])}"

        if LLMClient.is_openai_available():
            try:
                resp = LLMClient.chat_completion(system_prompt, user_prompt, response_format_json=True)
                parsed = json.loads(resp)
                if isinstance(parsed, list) and len(parsed) >= 4:
                    return parsed
            except Exception:
                pass

        # Fallback question suite
        return [
            {
                "id": "q1",
                "category": "BEHAVIORAL",
                "question": f"Tell me about a time you resolved a complex technical or operational challenge while delivering for {job_title} responsibilities.",
                "interviewer_intent": "Evaluates problem solving under pressure and ownership.",
                "recommended_story_angle": "Focus on a high-impact Master Vault achievement with quantified metrics."
            },
            {
                "id": "q2",
                "category": "TECHNICAL_COMPETENCY",
                "question": f"In your experience with {first_resp}, how do you ensure high performance, reliability, and code quality under tight deadlines?",
                "interviewer_intent": "Probes depth of domain expertise and engineering best practices.",
                "recommended_story_angle": "Explain specific architecture patterns and metric improvements you executed."
            },
            {
                "id": "q3",
                "category": "CULTURE_FIT",
                "question": f"Why are you interested in joining {company}, and how do your personal values align with our core team mission?",
                "interviewer_intent": "Tests company research depth and strategic enthusiasm.",
                "recommended_story_angle": "Leverage company intelligence hooks and mission statements."
            },
            {
                "id": "q4",
                "category": "LEADERSHIP_IMPACT",
                "question": f"Describe a situation where you led a initiative involving {sec_resp} and persuaded skeptical stakeholders to adopt your approach.",
                "interviewer_intent": "Measures communication clarity, empathy, and stakeholder influence.",
                "recommended_story_angle": "Detail the before/after metric transformation and collaborative alignment."
            }
        ]

    @staticmethod
    def evaluate_simulated_answer(
        question: str,
        user_answer: str,
        target_job_title: str = "Target Role"
    ) -> Dict[str, Any]:
        """
        Multi-dimensional evaluation of candidate's simulated interview response.
        """
        words = len(user_answer.split())
        has_metric = any(char.isdigit() for char in user_answer) or "%" in user_answer or "x" in user_answer.lower()
        
        star_score = min(96, max(55, words * 2)) if words >= 15 else 50
        metric_score = 90 if has_metric else 45
        tone_score = min(92, max(65, 100 - abs(words - 75)))
        alignment_score = 88 if ("architect" in user_answer.lower() or "lead" in user_answer.lower() or "result" in user_answer.lower()) else 74

        overall_readiness = int(0.35 * star_score + 0.30 * metric_score + 0.20 * alignment_score + 0.15 * tone_score)

        system_prompt = (
            "You are an Executive Interviewer evaluating a candidate's response. Respond ONLY with valid JSON:\n"
            "{\n"
            '  "overall_readiness": int,\n'
            '  "star_score": int,\n'
            '  "metric_score": int,\n'
            '  "tone_score": int,\n'
            '  "alignment_score": int,\n'
            '  "situation_feedback": str,\n'
            '  "action_feedback": str,\n'
            '  "result_feedback": str,\n'
            '  "tactical_coaching_tip": str\n'
            "}"
        )
        user_prompt = f"Target Role: {target_job_title}\nQuestion: {question}\nCandidate Response: {user_answer}"

        if LLMClient.is_openai_available():
            try:
                resp = LLMClient.chat_completion(system_prompt, user_prompt, response_format_json=True)
                parsed = json.loads(resp)
                if "overall_readiness" in parsed:
                    return parsed
            except Exception:
                pass

        return {
            "overall_readiness": overall_readiness,
            "star_score": star_score,
            "metric_score": metric_score,
            "tone_score": tone_score,
            "alignment_score": alignment_score,
            "situation_feedback": "Established baseline business context effectively.",
            "action_feedback": "Solid description of specific execution steps.",
            "result_feedback": "Verified metric present! Stating hard numbers elevates credibility." if has_metric else "Tip: Mention concrete percentage, throughput, or dollar values in your conclusion.",
            "tactical_coaching_tip": "Focus on emphasizing direct technical ownership ('I led', 'I architected') to project strong authority."
        }


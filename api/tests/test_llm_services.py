import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.llm_client import LLMClient
from app.services.ingestion_engine import IngestionEngine
from app.services.match_engine import MatchEngine
from app.services.xyz_synthesizer import XYZSynthesizer

def test_llm_services():
    print("🧪 Testing LLM Gateway & Vector Embedding Service...")
    embedding = LLMClient.generate_embedding("Senior Software Architect Next.js FastAPI")
    assert len(embedding) == 1536, f"Expected 1536D embedding, got {len(embedding)}"
    print(f"  ✓ Successfully generated 1536-dimensional vector embedding.")

    print("\n🧪 Testing Ingestion Engine Entity Parsing...")
    raw_resume = (
        "Lead Frontend Architect @ TechCloud Solutions (2022-Present)\n"
        "Reduced Largest Contentful Paint (LCP) by 42% by migrating to Next.js App Router.\n"
        "Managed a team of 6 engineers on design system components."
    )
    parsed = IngestionEngine.parse_entities_with_llm(raw_resume)
    assert len(parsed["experiences"]) > 0, "Failed to parse experiences"
    assert len(parsed["achievements"]) > 0, "Failed to parse achievements"
    print(f"  ✓ Extracted {len(parsed['experiences'])} experiences and {len(parsed['achievements'])} achievements.")

    print("\n🧪 Testing Vector Match Engine & Gap Classifier...")
    reqs = ["Optimize LCP latency under 100ms", "SOC2 Security Compliance"]
    gaps = MatchEngine.analyze_gaps(reqs, parsed["achievements"])
    assert "full_matches" in gaps and "potential_gaps" in gaps
    print(f"  ✓ Vector Matcher categorized requirements into Full Matches and Gaps.")

    print("\n🧪 Testing Google XYZ Formula Synthesizer...")
    synthesis = XYZSynthesizer.synthesize_google_xyz(
        gap_title="SOC2 Security Compliance",
        user_answer="I built zero-trust authentication middleware achieving 100% audit readiness"
    )
    assert "xyz_bullet" in synthesis
    assert len(synthesis["xyz_bullet"]) > 20
    print(f"  ✓ Formula Synthesized: \"{synthesis['xyz_bullet']}\"")

    print("\n🎉 ALL LLM INTEGRATION TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_llm_services()

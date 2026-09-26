import unittest
from app.services.job_scraper import JobScraperEngine

class TestJobScraperEngine(unittest.TestCase):
    def test_company_intelligence_analysis(self):
        sample_jd_text = """
        Acme AI Labs is building next-generation generative AI products.
        Our mission is to democratize intelligence for every software engineer.
        Values: Customer Obsession, Speed, Radical Transparency.
        Looking for a Senior Systems Engineer to optimize Next.js latency under 50ms.
        """
        intel = JobScraperEngine.analyze_company_intelligence("Acme AI Labs", sample_jd_text)
        
        self.assertIn("mission_statement", intel)
        self.assertIn("core_values", intel)
        self.assertIn("culture_insights", intel)
        self.assertIn("first_impression_hooks", intel)
        self.assertGreater(len(intel["first_impression_hooks"]), 0)

if __name__ == "__main__":
    unittest.main()

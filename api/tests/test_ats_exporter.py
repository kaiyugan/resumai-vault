import unittest
from app.services.ats_exporter import audit_resume_ats, generate_docx, generate_pdf

class TestATSExporter(unittest.TestCase):
    def setUp(self):
        self.sample_resume = {
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "+1 (555) 019-2831",
            "location": "San Francisco, CA",
            "linkedin": "https://linkedin.com/in/janedoe",
            "summary": "Accomplished Senior Software Engineer with 6+ years of experience in distributed systems and cloud architecture.",
            "experiences": [
                {
                    "title": "Senior Software Engineer",
                    "company": "Tech Corp",
                    "location": "San Francisco, CA",
                    "dates": "2021 – Present",
                    "bullets": [
                        "Accomplished 42% latency reduction by optimizing database indexing and query caching.",
                        "Engineered microservices processing 10,000+ requests per second with 99.99% uptime."
                    ]
                }
            ],
            "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Kubernetes"],
            "education": [
                {
                    "degree": "B.S. Computer Science",
                    "institution": "Stanford University",
                    "year": "2015 – 2019"
                }
            ]
        }
        self.sample_jd = "Looking for a Senior Software Engineer skilled in Python, FastAPI, PostgreSQL, microservices, and high throughput distributed systems."

    def test_audit_resume_ats(self):
        result = audit_resume_ats(self.sample_resume, self.sample_jd)
        self.assertIn("ats_score", result)
        self.assertGreaterEqual(result["ats_score"], 75)
        self.assertTrue(result["is_ats_compliant"])
        self.assertIn("score_breakdown", result)

    def test_generate_docx(self):
        docx_bytes = generate_docx(self.sample_resume)
        self.assertIsInstance(docx_bytes, bytes)
        self.assertGreater(len(docx_bytes), 1000)

    def test_generate_pdf(self):
        pdf_bytes = generate_pdf(self.sample_resume)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertGreater(len(pdf_bytes), 1000)

if __name__ == "__main__":
    unittest.main()

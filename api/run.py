import uvicorn
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    print("🚀 Launching Tailored Resume Intelligence FastAPI Server on http://localhost:8090...")
    print("📖 Interactive OpenAPI Documentation available at http://localhost:8090/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8090, reload=True)

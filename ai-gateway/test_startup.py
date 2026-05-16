"""
Quick test to check if AI Gateway can start
"""
import sys
print(f"Python version: {sys.version}")

try:
    import fastapi
    print(f"✓ FastAPI {fastapi.__version__} installed")
except ImportError as e:
    print(f"✗ FastAPI not installed: {e}")

try:
    import uvicorn
    print(f"✓ Uvicorn installed")
except ImportError as e:
    print(f"✗ Uvicorn not installed: {e}")

try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✓ python-dotenv installed")
except ImportError as e:
    print(f"✗ python-dotenv not installed: {e}")

try:
    import os
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    print(f"✓ GROQ_API_KEY: {'Set' if groq_key else 'Not set'}")
    print(f"✓ GEMINI_API_KEY: {'Set' if gemini_key else 'Not set'}")
except Exception as e:
    print(f"✗ Error checking env vars: {e}")

print("\n--- Checking AI Gateway structure ---")
import os
if os.path.exists("app/main.py"):
    print("✓ app/main.py exists")
if os.path.exists("app/routers"):
    print("✓ app/routers directory exists")
if os.path.exists("app/services"):
    print("✓ app/services directory exists")

print("\n--- Ready to start AI Gateway ---")
print("Run: .venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --port 8000")

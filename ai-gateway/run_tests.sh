#!/bin/bash
# Run all tests for AI Gateway

echo "==================================="
echo "CivilAI Gateway - Test Suite"
echo "==================================="

# Activate virtual environment
source .venv/bin/activate

# Run startup test
echo ""
echo "1. Testing startup configuration..."
python test_startup.py

# Run end-to-end tests
echo ""
echo "2. Running end-to-end tests..."
python test_e2e.py

# Check if server is running
echo ""
echo "3. Checking if server is running..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✓ Server is running"
    
    # Run API tests
    echo ""
    echo "4. Running API endpoint tests..."
    python test_api_endpoints.py
else
    echo "✗ Server is not running"
    echo "Start server with: uvicorn app.main:app --reload --port 8000"
fi

echo ""
echo "==================================="
echo "Test suite completed"
echo "==================================="

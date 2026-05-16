#!/bin/bash

echo "Testing CivilAI Registration Endpoint"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1. Testing Backend Health..."
curl -s http://localhost:8080/actuator/health
echo -e "\n"

# Test 2: Registration
echo "2. Testing Registration..."
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }' \
  -v
echo -e "\n"

echo "======================================"
echo "Test Complete"

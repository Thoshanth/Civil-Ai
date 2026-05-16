#!/bin/bash

# CivilAI Deployment Status Checker
# Checks if all services are running correctly

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default URLs (update these with your actual deployment URLs)
AI_GATEWAY_URL="${AI_GATEWAY_URL:-https://civilai-gateway.onrender.com}"
BACKEND_URL="${BACKEND_URL:-https://civilai-backend.onrender.com}"
FRONTEND_URL="${FRONTEND_URL:-https://civilai.vercel.app}"

echo "=========================================="
echo "  CivilAI Deployment Status Checker"
echo "=========================================="
echo ""

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response)"
        return 1
    fi
}

# Function to check JSON response
check_json_service() {
    local name=$1
    local url=$2
    
    echo -n "Checking $name... "
    
    response=$(curl -s "$url" 2>/dev/null || echo "{}")
    
    if echo "$response" | grep -q "status"; then
        echo -e "${GREEN}✓ OK${NC}"
        echo "  Response: $response"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Response: $response"
        return 1
    fi
}

# Check AI Gateway
echo -e "${BLUE}1. AI Gateway${NC}"
check_json_service "Health endpoint" "$AI_GATEWAY_URL/health"
echo ""

# Check Backend
echo -e "${BLUE}2. Backend${NC}"
check_json_service "Health endpoint" "$BACKEND_URL/actuator/health"
check_service "Swagger UI" "$BACKEND_URL/swagger-ui/index.html" "200"
echo ""

# Check Frontend
echo -e "${BLUE}3. Frontend${NC}"
check_service "Home page" "$FRONTEND_URL" "200"
echo ""

# Test API endpoints
echo -e "${BLUE}4. API Endpoints${NC}"

# Test registration endpoint
echo -n "Testing registration endpoint... "
reg_response=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}' \
    2>/dev/null || echo "{}")

if echo "$reg_response" | grep -q "error\|token\|already"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ UNKNOWN${NC}"
fi

# Test AI Gateway structural calculation
echo -n "Testing AI Gateway calculation... "
calc_response=$(curl -s -X POST "$AI_GATEWAY_URL/api/structural/calculate" \
    -H "Content-Type: application/json" \
    -d '{"building_type":"residential","floor_area_m2":400,"floors":4,"zone":"IV","soil_type":"II"}' \
    2>/dev/null || echo "{}")

if echo "$calc_response" | grep -q "dead_load\|live_load\|error"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ UNKNOWN${NC}"
fi

echo ""

# Summary
echo "=========================================="
echo "  Summary"
echo "=========================================="
echo ""
echo "Service URLs:"
echo "  Frontend:   $FRONTEND_URL"
echo "  Backend:    $BACKEND_URL"
echo "  AI Gateway: $AI_GATEWAY_URL"
echo ""
echo "API Documentation:"
echo "  Swagger UI: $BACKEND_URL/swagger-ui"
echo "  OpenAPI:    $BACKEND_URL/api-docs"
echo "  AI Docs:    $AI_GATEWAY_URL/docs"
echo ""

# Check if services are sleeping (Render free tier)
echo -e "${YELLOW}Note:${NC} Free tier services may sleep after 15 min inactivity."
echo "First request may take 30-60 seconds (cold start)."
echo ""
echo "To keep services awake, use a cron job:"
echo "  https://cron-job.org"
echo "  Ping every 14 minutes:"
echo "    - $BACKEND_URL/actuator/health"
echo "    - $AI_GATEWAY_URL/health"
echo ""

echo "=========================================="
echo "  Deployment Status: Complete"
echo "=========================================="

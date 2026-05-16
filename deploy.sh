#!/bin/bash

# CivilAI Deployment Script
# This script helps you deploy CivilAI to free cloud services

set -e

echo "🚀 CivilAI Deployment Helper"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if required tools are installed
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if command -v git &> /dev/null; then
        print_success "Git installed"
    else
        print_error "Git not found. Please install Git."
        exit 1
    fi
    
    if command -v node &> /dev/null; then
        print_success "Node.js installed ($(node --version))"
    else
        print_warning "Node.js not found (needed for frontend)"
    fi
    
    if command -v mvn &> /dev/null; then
        print_success "Maven installed ($(mvn --version | head -n 1))"
    else
        print_warning "Maven not found (needed for backend)"
    fi
    
    if command -v python3 &> /dev/null; then
        print_success "Python installed ($(python3 --version))"
    else
        print_warning "Python not found (needed for AI gateway)"
    fi
    
    echo ""
}

# Display deployment steps
show_deployment_guide() {
    echo "📋 Deployment Steps:"
    echo ""
    echo "1. Database Setup (Neon.tech)"
    echo "   → Go to https://neon.tech"
    echo "   → Create project: 'civilai'"
    echo "   → Copy connection string"
    echo ""
    echo "2. File Storage Setup (Cloudflare R2)"
    echo "   → Go to https://cloudflare.com"
    echo "   → Create R2 bucket: 'civilai-files'"
    echo "   → Generate API token"
    echo ""
    echo "3. Get API Keys"
    echo "   → Groq: https://console.groq.com"
    echo "   → Gemini: https://aistudio.google.com/app/apikey"
    echo "   → HuggingFace: https://huggingface.co/settings/tokens"
    echo ""
    echo "4. Deploy AI Gateway (Render.com)"
    echo "   → Go to https://render.com"
    echo "   → New Web Service → Connect GitHub"
    echo "   → Select 'ai-gateway' folder"
    echo "   → Use ai-gateway/render.yaml config"
    echo "   → Add environment variables"
    echo ""
    echo "5. Deploy Backend (Render.com)"
    echo "   → New Web Service → Connect GitHub"
    echo "   → Select 'backend' folder"
    echo "   → Use backend/render.yaml config"
    echo "   → Add environment variables"
    echo ""
    echo "6. Deploy Frontend (Vercel)"
    echo "   → Go to https://vercel.com"
    echo "   → Import GitHub repository"
    echo "   → Select 'frontend' folder"
    echo "   → Add VITE_API_BASE_URL env var"
    echo ""
    echo "📖 Full guide: See DEPLOYMENT.md"
    echo ""
}

# Test local setup
test_local() {
    echo "🧪 Testing Local Setup..."
    echo ""
    
    # Test AI Gateway
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "AI Gateway is running (http://localhost:8000)"
    else
        print_warning "AI Gateway not running (http://localhost:8000)"
    fi
    
    # Test Backend
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        print_success "Backend is running (http://localhost:8080)"
    else
        print_warning "Backend not running (http://localhost:8080)"
    fi
    
    # Test Frontend
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_success "Frontend is running (http://localhost:5173)"
    else
        print_warning "Frontend not running (http://localhost:5173)"
    fi
    
    echo ""
}

# Generate environment variable template
generate_env_template() {
    echo "📝 Generating environment variable templates..."
    
    # Backend .env template
    cat > backend/.env.deploy << 'EOF'
# Database Configuration (Neon.tech)
DB_HOST=your-project.neon.tech:5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=neondb
DB_SSL_MODE=require

# File Storage Configuration (Cloudflare R2)
MINIO_ENDPOINT=https://your-account.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=your_r2_access_key
MINIO_SECRET_KEY=your_r2_secret_key
MINIO_BUCKET=civilai-files

# AI Service Configuration
AI_SERVICE_URL=https://civilai-gateway.onrender.com

# JWT Configuration (generate random 32+ character string)
JWT_SECRET=change_this_to_a_random_32_character_string_minimum

# Email Configuration (Optional)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587

# Spring Profile
SPRING_PROFILES_ACTIVE=prod
EOF
    
    # AI Gateway .env template
    cat > ai-gateway/.env.deploy << 'EOF'
# LLM API Keys
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
HF_TOKEN=hf_your_huggingface_token

# Python Version
PYTHON_VERSION=3.11
EOF
    
    # Frontend .env template
    cat > frontend/.env.deploy << 'EOF'
# Backend API URL (update with your Render backend URL)
VITE_API_BASE_URL=https://civilai-backend.onrender.com/api
EOF
    
    print_success "Created deployment environment templates:"
    print_info "  - backend/.env.deploy"
    print_info "  - ai-gateway/.env.deploy"
    print_info "  - frontend/.env.deploy"
    echo ""
    print_warning "⚠️  Fill in these templates with your actual credentials"
    echo ""
}

# Main menu
show_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1) Show deployment guide"
    echo "2) Generate environment variable templates"
    echo "3) Test local setup"
    echo "4) Check prerequisites"
    echo "5) Open deployment documentation"
    echo "6) Exit"
    echo ""
    read -p "Enter choice [1-6]: " choice
    
    case $choice in
        1)
            show_deployment_guide
            ;;
        2)
            generate_env_template
            ;;
        3)
            test_local
            ;;
        4)
            check_prerequisites
            ;;
        5)
            if command -v xdg-open &> /dev/null; then
                xdg-open DEPLOYMENT.md
            elif command -v open &> /dev/null; then
                open DEPLOYMENT.md
            else
                print_info "Please open DEPLOYMENT.md manually"
            fi
            ;;
        6)
            echo "Goodbye! 👋"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Run
check_prerequisites
show_menu

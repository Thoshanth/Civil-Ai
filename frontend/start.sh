#!/bin/bash

echo "Starting CivilAI Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
fi

echo "Starting development server..."
echo "Frontend will be available at http://localhost:5173"
echo ""
npm run dev

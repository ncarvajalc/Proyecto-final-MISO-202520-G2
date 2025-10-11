#!/bin/bash

# Database Setup Script for SecurityAndAudit Module
# This script initializes the database and seeds it with test data

echo "SecurityAndAudit Database Setup"
echo "=================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Initializing database..."
python -m app.core.init_db

echo ""
echo "Seeding database with initial data..."
python -m app.core.seed_db

echo ""
echo "Database setup complete!"
echo ""
echo "Test Users Created:"
echo "   - admin@example.com / admin123 (Administrator)"
echo "   - editor@example.com / editor123 (Editor)"
echo "   - viewer@example.com / viewer123 (Viewer)"
echo ""
echo "Start the server with:"
echo "   uvicorn app.main:app --reload --port 8003"
echo ""


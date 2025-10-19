#!/bin/bash

# Script to run tests with coverage for SalesForce service

cd backend/SalesForce

echo "Running tests with coverage for SalesForce..."
pytest tests/ \
  --cov=app/modules/sales \
  --cov=app/modules/salespeople \
  --cov-report=term-missing \
  --cov-report=html:../../htmlcov/SalesForce \
  --cov-report=lcov:../../coverage_salesforce.lcov \
  -v

echo ""
echo "Coverage report generated:"
echo "  - HTML: htmlcov/SalesForce/index.html"
echo "  - LCOV: coverage_salesforce.lcov"


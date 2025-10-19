#!/bin/bash

# Script to run tests with coverage for PurchasesAndSuppliers service

cd backend/PurchasesAndSuppliers

echo "Running tests with coverage for PurchasesAndSuppliers..."
pytest tests/ \
  --cov=app/modules/products \
  --cov=app/modules/suppliers \
  --cov-report=term-missing \
  --cov-report=html:../../htmlcov/PurchasesAndSuppliers \
  --cov-report=lcov:../../coverage_purchases.lcov \
  -v

echo ""
echo "Coverage report generated:"
echo "  - HTML: htmlcov/PurchasesAndSuppliers/index.html"
echo "  - LCOV: coverage_purchases.lcov"


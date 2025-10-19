#!/bin/bash

# Script to run tests with coverage for all backend services

echo "========================================"
echo "Running coverage for all backend services"
echo "========================================"
echo ""

# Run PurchasesAndSuppliers tests
echo "1. PurchasesAndSuppliers"
echo "----------------------------------------"
cd backend/PurchasesAndSuppliers
pytest tests/ \
  --cov=app/modules/products \
  --cov=app/modules/suppliers \
  --cov-report=term-missing \
  --cov-report=html:../../htmlcov/PurchasesAndSuppliers \
  --cov-report=lcov:../../coverage_purchases.lcov \
  -v

cd ../..
echo ""
echo ""

# Run SalesForce tests
echo "2. SalesForce"
echo "----------------------------------------"
cd backend/SalesForce
pytest tests/ \
  --cov=app/modules/sales \
  --cov=app/modules/salespeople \
  --cov-report=term-missing \
  --cov-report=html:../../htmlcov/SalesForce \
  --cov-report=lcov:../../coverage_salesforce.lcov \
  -v

cd ../..
echo ""
echo ""

echo "========================================"
echo "Coverage Summary"
echo "========================================"
echo "HTML Reports:"
echo "  - PurchasesAndSuppliers: htmlcov/PurchasesAndSuppliers/index.html"
echo "  - SalesForce: htmlcov/SalesForce/index.html"
echo ""
echo "LCOV Reports:"
echo "  - coverage_purchases.lcov"
echo "  - coverage_salesforce.lcov"


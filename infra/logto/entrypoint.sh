#!/bin/bash
set -e

echo "=== StaySafeOS Logto Init ==="
echo "Checking if database needs initialization..."

cd /etc/logto

# Use the bundled CLI to seed the database
# --swe flag skips if already seeded
echo "Running database seed..."
npm run cli db seed -- --swe 2>&1 || echo "Seed completed or already exists"

# Deploy any pending alterations
echo "Running database alterations..."
npm run cli db alteration deploy 2>&1 || echo "Alterations completed or already deployed"

echo "=== Starting Logto Server ==="
exec npm start

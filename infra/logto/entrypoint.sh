#!/bin/sh
set -e

echo "Checking if database needs seeding..."

# Try to seed the database (will fail gracefully if already seeded)
npx @logto/cli db seed --swe || echo "Database already seeded or seed failed, continuing..."

# Run alterations to ensure schema is up to date
npx @logto/cli db alteration deploy || echo "Alterations already deployed, continuing..."

echo "Starting Logto..."
exec npm start

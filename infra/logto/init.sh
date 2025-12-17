#!/bin/sh

echo "=== StaySafeOS Logto Init ==="

cd /etc/logto

echo "Seeding database..."
npm run cli db seed -- --swe || true

echo "Deploying alterations..."
npm run cli db alteration deploy || true

echo "Starting Logto..."
exec npm start

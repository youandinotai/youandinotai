#!/bin/bash
set -e

echo "🗄️  Pushing database schema to production..."
npm run db:push -- --force

echo "🚀 Starting production server..."
NODE_ENV=production node dist/index.js

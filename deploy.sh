#!/bin/bash

# SignalIQ Deployment Script for Railway
# This script prepares the application for deployment

set -e

echo "🚀 Preparing SignalIQ for Railway deployment..."

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    exit 1
fi

echo "✅ Environment variables validated"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t signaliq:latest .

echo "✅ Docker image built successfully"

# Run database migrations
echo "📊 Running database migrations..."
docker run --rm \
    -e DATABASE_URL="$DATABASE_URL" \
    -e OPENAI_API_KEY="$OPENAI_API_KEY" \
    -e SUPABASE_URL="$SUPABASE_URL" \
    -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    signaliq:latest \
    alembic upgrade head

echo "✅ Database migrations completed"

# Test the application
echo "🧪 Testing application..."
docker run --rm -d \
    --name signaliq-test \
    -p 5000:5000 \
    -e DATABASE_URL="$DATABASE_URL" \
    -e OPENAI_API_KEY="$OPENAI_API_KEY" \
    -e SUPABASE_URL="$SUPABASE_URL" \
    -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    signaliq:latest

# Wait for application to start
sleep 10

# Health check
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Application health check passed"
    docker stop signaliq-test
else
    echo "❌ Application health check failed"
    docker stop signaliq-test
    exit 1
fi

echo "🎉 SignalIQ is ready for Railway deployment!"
echo ""
echo "📋 Deployment checklist:"
echo "  ✅ Docker image built"
echo "  ✅ Database migrations ready"
echo "  ✅ Health checks passing"
echo "  ✅ Environment variables configured"
echo ""
echo "🚀 Deploy to Railway with:"
echo "  railway up"
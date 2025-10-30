#!/bin/bash

echo "🐳 Checking Docker status..."
echo ""

# Wait for Docker daemon to be ready
MAX_TRIES=30
TRIES=0

while ! docker info > /dev/null 2>&1; do
    TRIES=$((TRIES + 1))
    if [ $TRIES -gt $MAX_TRIES ]; then
        echo "❌ Docker daemon did not start in time."
        echo "Please ensure Docker Desktop is running and try again."
        exit 1
    fi
    echo "⏳ Waiting for Docker daemon to start... (attempt $TRIES/$MAX_TRIES)"
    sleep 2
done

echo "✅ Docker is ready!"
echo ""
echo "🚀 Starting Job Application Tracker..."
echo ""

# Start the application
docker compose up -d

echo ""
echo "✅ Application is starting!"
echo ""
echo "📍 URLs:"
echo "   Frontend Dashboard: http://localhost:3000"
echo "   Backend API:        http://localhost:8000"
echo "   API Docs:           http://localhost:8000/api/docs"
echo ""
echo "⏳ Please wait 30-60 seconds for all services to initialize..."
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop:      docker compose down"

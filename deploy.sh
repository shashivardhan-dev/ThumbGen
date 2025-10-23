#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment...${NC}"

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo -e "${GREEN}✅ Loaded environment variables from .env${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Basic validations
if [ -z "${DOCKERHUB_USERNAME:-}" ]; then
    echo -e "${RED}❌ DOCKERHUB_USERNAME not set. Define it in .env or as an environment variable.${NC}"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found in current directory${NC}"
    exit 1
fi

# Stop and remove old containers
echo -e "${YELLOW}📦 Stopping old containers...${NC}"
docker-compose down --remove-orphans || true

# Remove old images (keep last 2)
if [ -n "${DOCKERHUB_USERNAME:-}" ]; then
    echo -e "${YELLOW}🧹 Cleaning up old images for ${DOCKERHUB_USERNAME}/nextjs-app...${NC}"
    docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | \
        grep "^${DOCKERHUB_USERNAME}/nextjs-app" | \
        awk '{print $2}' | \
        tail -n +3 | \
        xargs -r docker rmi -f || true
else
    echo -e "${YELLOW}⚠️ Skipping image cleanup: DOCKERHUB_USERNAME not set.${NC}"
fi

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest images...${NC}"
docker-compose pull || {
    echo -e "${RED}❌ Failed to pull images${NC}"
    exit 1
}

# Start containers
echo -e "${YELLOW}🏗️  Starting containers...${NC}"
docker-compose up -d || {
    echo -e "${RED}❌ Failed to start containers${NC}"
    docker-compose logs --tail=50
    exit 1
}

# Wait for containers to be healthy
echo -e "${YELLOW}⏳ Waiting for containers to be healthy...${NC}"
TIMEOUT=120
ELAPSED=0
SLEEP_INTERVAL=5
CONTAINER_NAME="nextjs-app"

while [ $ELAPSED -lt $TIMEOUT ]; do
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "missing")
    
    if [ "$health_status" = "healthy" ]; then
        echo -e "${GREEN}✅ Application is healthy!${NC}"
        break
    fi

    if [ "$health_status" = "unhealthy" ]; then
        echo -e "${RED}❌ Container reported unhealthy. Dumping logs...${NC}"
        docker-compose logs --tail=100 || true
        exit 1
    fi 
    
    if [ "$health_status" = "missing" ]; then
        echo -e "Container not found yet (${ELAPSED}s elapsed)"
    else
        echo -e "Health status: $health_status (${ELAPSED}s elapsed)"
    fi
    
    sleep $SLEEP_INTERVAL
    ELAPSED=$((ELAPSED + SLEEP_INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "${RED}❌ Health check timeout. Checking logs...${NC}"
    docker-compose logs --tail=50
    exit 1
fi

# Display container status
echo -e "${GREEN}📊 Container Status:${NC}"
docker-compose ps

# Show logs
echo -e "${GREEN}📝 Recent logs:${NC}"
docker-compose logs --tail=20

# Cleanup old dangling images
echo -e "${YELLOW}🧹 Cleaning up dangling images...${NC}"
docker image prune -f || true

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
if command -v hostname >/dev/null 2>&1; then
    echo -e "${GREEN}🌐 Application is running at: http://$(hostname)${NC}"
fi

# Optional: Send notification
# curl -X POST "https://your-notification-service.com/webhook" \
#     -H "Content-Type: application/json" \
#     -d '{"text":"✅ Deployment successful"}'
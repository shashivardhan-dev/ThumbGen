#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting deployment...${NC}"

# Load env vars
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo -e "${GREEN}✅ Environment variables loaded from $ENV_FILE${NC}"
else
    echo -e "${RED}⚠️  $ENV_FILE file not found. Aborting.${NC}"
    exit 1
fi

# Validate required vars
REQUIRED_VARS=(DOCKERHUB_USERNAME)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo -e "${RED}❌ $var not set. Aborting deployment.${NC}"
    exit 1
  fi
done

# Stop old containers
echo -e "${YELLOW}📦 Stopping old containers...${NC}"
docker-compose down --remove-orphans || true

# Remove old nextjs-app images
echo -e "${YELLOW}🧼 Cleaning old images...${NC}"
docker ps -a --filter "name=nextjs-app" --format "{{.ID}}" | xargs -r docker rm -f || true
docker images | grep "nextjs-app" | grep "<none>" | awk '{print $3}' | xargs -r docker rmi -f || true
docker images | grep "nodejs-app" | grep "local"  | awk '{print $3}' | xargs -r docker rmi -f || true

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest Docker images...${NC}"
docker-compose pull

# Start containers
echo -e "${YELLOW}🏗️  Starting containers...${NC}"
docker-compose up -d

# Wait for healthy container
echo -e "${YELLOW}⏳ Waiting for nextjs-app to be healthy...${NC}"
TIMEOUT=120
ELAPSED=0
CONTAINER_NAME="nextjs-app"

while [ $ELAPSED -lt $TIMEOUT ]; do
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "missing")
    if [ "$health_status" = "healthy" ]; then
        echo -e "${GREEN}✅ Application is healthy!${NC}"
        break
    fi
    if [ "$health_status" = "unhealthy" ]; then
        echo -e "${RED}❌ Container unhealthy. Dumping logs...${NC}"
        docker-compose logs --tail=100 app || true
        exit 1
    fi
    echo -e "Health status: $health_status (${ELAPSED}s elapsed)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "${RED}❌ Health check timeout.${NC}"
    docker-compose logs --tail=50 app
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
if command -v hostname >/dev/null 2>&1; then
    echo -e "${GREEN}🌐 Application is running at: http://$(hostname -I | awk '{print $1}')${NC}"
fi
# Optional: Send notification
# curl -X POST "https://your-notification-service.com/webhook" \
#     -H "Content-Type: application/json" \
#     -d '{"text":"✅ Deployment successful"}'
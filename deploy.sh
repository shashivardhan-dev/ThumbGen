#!/bin/bash
set -euo pipefail

# -----------------------------
# Colors
# -----------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# -----------------------------
# Configuration
# -----------------------------
COMPOSE_FILE="./docker-compose.yml"  # adjust if your file is elsewhere
CONTAINER_SERVICE="nextjs-app"       # must match service name in docker-compose.yml
HEALTH_ENDPOINT="/api/health"        # health check endpoint
HEALTH_TIMEOUT=120                    # seconds

echo -e "${GREEN}🚀 Starting deployment...${NC}"

# -----------------------------
# Load env vars
# -----------------------------
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo -e "${GREEN}✅ Environment variables loaded from $ENV_FILE${NC}"
else
    echo -e "${RED}⚠️  $ENV_FILE not found. Aborting.${NC}"
    exit 1
fi

# -----------------------------
# Validate required vars
# -----------------------------
REQUIRED_VARS=(DOCKERHUB_USERNAME)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo -e "${RED}❌ $var not set. Aborting deployment.${NC}"
    exit 1
  fi
done

# -----------------------------
# Ensure docker-compose file exists
# -----------------------------
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ docker-compose file not found at $COMPOSE_FILE${NC}"
    exit 1
fi

# -----------------------------
# Stop old containers
# -----------------------------
echo -e "${YELLOW}📦 Stopping old containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true

# -----------------------------
# Clean old images
# -----------------------------
echo -e "${YELLOW}🧼 Cleaning old Docker images...${NC}"
docker ps -a --filter "name=$CONTAINER_SERVICE" --format "{{.ID}}" | xargs -r docker rm -f || true
docker images | grep "$CONTAINER_SERVICE" | grep "<none>" | awk '{print $3}' | xargs -r docker rmi -f || true
docker images | grep "$CONTAINER_SERVICE" | grep "local"  | awk '{print $3}' | xargs -r docker rmi -f || true

# -----------------------------
# Pull latest images
# -----------------------------
echo -e "${YELLOW}📥 Pulling latest Docker images...${NC}"
docker-compose -f "$COMPOSE_FILE" pull

# -----------------------------
# Start containers
# -----------------------------
echo -e "${YELLOW}🏗️  Starting containers...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

# -----------------------------
# Wait for healthy container
# -----------------------------
echo -e "${YELLOW}⏳ Waiting for $CONTAINER_SERVICE to be healthy...${NC}"
ELAPSED=0
while [ $ELAPSED -lt $HEALTH_TIMEOUT ]; do
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_SERVICE" 2>/dev/null || echo "missing")
    if [ "$health_status" = "healthy" ]; then
        echo -e "${GREEN}✅ $CONTAINER_SERVICE is healthy!${NC}"
        break
    fi
    if [ "$health_status" = "unhealthy" ]; then
        echo -e "${RED}❌ Container unhealthy. Dumping logs...${NC}"
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 "$CONTAINER_SERVICE" || true
        exit 1
    fi
    echo -e "Health status: $health_status (${ELAPSED}s elapsed)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $HEALTH_TIMEOUT ]; then
    echo -e "${RED}❌ Health check timeout.${NC}"
    docker-compose -f "$COMPOSE_FILE" logs --tail=50 "$CONTAINER_SERVICE"
    exit 1
fi

# -----------------------------
# Final HTTP health check
# -----------------------------
APP_URL="http://localhost$HEALTH_ENDPOINT"
response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ HTTP health check passed (${APP_URL})${NC}"
else
    echo -e "${RED}❌ HTTP health check failed ($response)${NC}"
    exit 1
fi

# -----------------------------
# Success message
# -----------------------------
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
if command -v hostname >/dev/null 2>&1; then
    echo -e "${GREEN}🌐 Application is running at: http://$(hostname -I | awk '{print $1}')${NC}"
fi

# Optional: Send notification
# curl -X POST "https://your-notification-service.com/webhook" \
#     -H "Content-Type: application/json" \
#     -d '{"text":"✅ Deployment successful"}'
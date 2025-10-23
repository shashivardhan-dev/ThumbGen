# deploy.sh
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
    export $(cat .env | grep -v '^#' | xargs)
fi

# Basic validations
if [ -z "${DOCKERHUB_USERNAME:-}" ]; then
echo -e "${RED}❌ DOCKERHUB_USERNAME not set. Define it in .env or as an environment variable.${NC}"
# If you prefer to continue without image cleanup, comment out the exit line below
# exit 1
fi


if [ -z "${EC2_USERNAME:-}" ]; then
# EC2_USERNAME is only required when running locally on target box with assumptions; warn if missing
echo -e "${YELLOW}⚠️ EC2_USERNAME not set. Make sure you are running this script on the target host in /home/<user>/app.${NC}"
fi

# Stop and remove old containers
echo -e "${YELLOW}📦 Stopping old containers...${NC}"
docker-compose down --remove-orphans || true

# Remove old images (keep last 2) — safe guard when DOCKERHUB_USERNAME available
if [ -n "${DOCKERHUB_USERNAME:-}" ]; then
echo -e "${YELLOW}🧹 Cleaning up old images for ${DOCKERHUB_USERNAME}/nextjs-app...${NC}"
docker images --format '{{.Repository}} {{.ID}} {{.Tag}}' | grep "^${DOCKERHUB_USERNAME}/nextjs-app" | awk '{print $2}' | tail -n +3 | xargs -r docker rmi -f || true
else
echo -e "${YELLOW}⚠️ Skipping image cleanup: DOCKERHUB_USERNAME not set.${NC}"
fi

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest images...${NC}"
docker-compose pull

# Start containers
echo -e "${YELLOW}🏗️  Starting containers...${NC}"
docker-compose up -d

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
    docker-compose logs --tail=100 app || true
    exit 1
    fi 
    
    echo -e "Health status: $health_status (${ELAPSED}s elapsed)"
    sleep 5
    ELAPSED=$((elapsed + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "${RED}❌ Health check timeout. Checking logs...${NC}"
    docker-compose logs --tail=50 app
    exit 1
fi

# Display container status
echo -e "${GREEN}📊 Container Status:${NC}"
docker-compose ps

# Show logs
echo -e "${GREEN}📝 Recent logs:${NC}"
docker-compose logs --tail=20

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
if command -v hostname >/dev/null 2>&1; then
echo -e "${GREEN}🌐 Application is running at: https://$(hostname)${NC}"
fi

# Optional: Send notification
# curl -X POST "https://your-notification-service.com/webhook" \
#     -H "Content-Type: application/json" \
#     -d '{"text":"✅ Deployment successful"}'
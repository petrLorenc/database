#!/bin/bash

# Set colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display usage
function show_usage {
    echo -e "${YELLOW}Usage: $0 [start|stop|status|logs|rebuild]${NC}"
    echo "  start   - Start all services"
    echo "  stop    - Stop all services"
    echo "  status  - Check the status of all services"
    echo "  logs    - Show logs from all services"
    echo "  rebuild - Rebuild and start all services"
}

# Function to start services
function start_services {
    echo -e "${GREEN}Starting services...${NC}"
    docker compose up
}

# Function to stop services
function stop_services {
    echo -e "${GREEN}Stopping services...${NC}"
    docker compose down
    echo -e "${GREEN}Services stopped${NC}"
}

# Function to show service status
function show_status {
    echo -e "${GREEN}Service status:${NC}"
    docker compose ps
}

# Function to show service logs
function show_logs {
    echo -e "${GREEN}Service logs:${NC}"
    docker compose logs -f
}

# Function to rebuild services
function rebuild_services {
    echo -e "${GREEN}Rebuilding services...${NC}"
    docker compose down
    docker compose build
    docker compose up
    echo -e "${GREEN}Services rebuilt and started!${NC}"
}

# Check command line argument
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

# Process command line argument
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    rebuild)
        rebuild_services
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_usage
        exit 1
        ;;
esac

exit 0
#!/bin/bash

# Function to check if terminal exists
check_terminal() {
    if [ -t 1 ]; then
        return 0  # Terminal exists
    else
        return 1  # No terminal
    fi
}

# Set up logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
STOP_LOG="$LOG_DIR/stop-services.log"

# Logging function
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$STOP_LOG"
}

log_message "Starting service shutdown sequence..."

# Stop Dashboard Frontend (Vite/React)
log_message "Stopping Dashboard Frontend..."
pkill -f "dashboard_integration/frontend"

# Stop VRT Guard Service
log_message "Stopping VRT Guard Service..."
pkill -f "vrt_guard_service"

# Stop GhostBuster Backend
log_message "Stopping GhostBuster Backend..."
pkill -f "ghostbuster_backend"

# Stop GhostBuster Frontend
log_message "Stopping GhostBuster Frontend..."
pkill -f "ghostbuster_frontend"

# Stop API Gateway
log_message "Stopping API Gateway..."
pkill -f "api_gateway"

# Stop Predictive Analytics Service
log_message "Stopping Predictive Analytics Service..."
pkill -f "predictive_analytics"

# Give processes a moment to shut down
sleep 2

# Verify all services are stopped
check_running_services() {
    local services=(
        "dashboard_integration/frontend"
        "vrt_guard_service"
        "ghostbuster_backend"
        "ghostbuster_frontend"
        "api_gateway"
        "predictive_analytics"
    )
    
    local still_running=0
    
    for service in "${services[@]}"; do
        if pgrep -f "$service" > /dev/null; then
            log_message "Warning: $service is still running"
            still_running=1
        fi
    done
    
    return $still_running
}

if check_running_services; then
    log_message "All services stopped successfully"
else
    log_message "Some services may still be running. Please check manually."
fi
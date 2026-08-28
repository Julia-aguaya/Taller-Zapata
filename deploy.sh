#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Taller-Zapata}"
APP_DIR="${APP_DIR:-$HOME/apps/taller-zapata}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_SERVICE="${BACKEND_SERVICE:-taller-zapata-backend}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/actuator/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-18}"
HEALTH_SLEEP_SECONDS="${HEALTH_SLEEP_SECONDS:-5}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

check_paths() {
  [[ -d "$REPO_DIR" ]] || { printf 'Repository directory not found: %s\n' "$REPO_DIR" >&2; exit 1; }
  [[ -f "$BACKEND_DIR/.env" ]] || { printf 'Backend env file not found: %s\n' "$BACKEND_DIR/.env" >&2; exit 1; }
}

check_frontend_env() {
  local env_file="$REPO_DIR/.env"

  if [[ -f "$env_file" ]] && grep -q 'VITE_API_BASE_URL=http://localhost:8081/api/v1' "$env_file"; then
    printf 'Refusing to build frontend: %s still points to localhost:8081\n' "$env_file" >&2
    printf 'Fix or remove that variable before running deploy.sh\n' >&2
    exit 1
  fi
}

deploy_backend() {
  log "Building backend"
  cd "$REPO_DIR/backend"
  mvn clean package -DskipTests

  log "Updating backend artifact"
  mkdir -p "$BACKEND_DIR"
  cp "$REPO_DIR"/backend/target/*.jar "$BACKEND_DIR/app.jar"

  log "Restarting backend service"
  sudo systemctl restart "$BACKEND_SERVICE"
  sudo systemctl status "$BACKEND_SERVICE" --no-pager
}

deploy_frontend() {
  log "Building frontend front2"
  cd "$REPO_DIR"
  rm -rf front2/dist
  npm ci --prefix front2
  npm run build --prefix front2

  log "Publishing frontend assets"
  rm -rf "$FRONTEND_DIR"
  mkdir -p "$FRONTEND_DIR"
  cp -a "$REPO_DIR"/front2/dist/. "$FRONTEND_DIR/"

  log "Reloading nginx"
  sudo systemctl reload "$NGINX_SERVICE"
}

verify_deploy() {
  log "Checking backend health"
  local attempt

  for attempt in $(seq 1 "$HEALTH_RETRIES"); do
    if curl --fail --silent --show-error "$HEALTH_URL"; then
      printf '\n'
      break
    fi

    if [[ "$attempt" -eq "$HEALTH_RETRIES" ]]; then
      printf '\nBackend health check failed after %s attempts\n' "$HEALTH_RETRIES" >&2
      exit 1
    fi

    printf '\nBackend not ready yet (attempt %s/%s). Waiting %ss...\n' "$attempt" "$HEALTH_RETRIES" "$HEALTH_SLEEP_SECONDS"
    sleep "$HEALTH_SLEEP_SECONDS"
  done

  log "Checking frontend bundle for stale localhost:8081"
  if grep -R -q 'localhost:8081' "$FRONTEND_DIR"; then
    printf 'Frontend deploy still contains localhost:8081 references\n' >&2
    exit 1
  fi
}

main() {
  require_command git
  require_command mvn
  require_command npm
  require_command curl
  check_paths
  check_frontend_env

  log "Updating repository"
  cd "$REPO_DIR"
  git pull --ff-only

  deploy_backend
  deploy_frontend
  verify_deploy

  log "Deploy finished successfully"
}

main "$@"

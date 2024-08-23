#!/bin/sh

# Pass all entered params after the docker compose call
COMPOSE_PROJECT_NAME="connect" GIT_SHA=$(git rev-parse --short HEAD) IS_TAGGED=$(git describe --tags --abbrev=0 --exact-match || echo '') docker compose -f docker-compose.yml "$@"

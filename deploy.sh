#!/usr/bin/env bash
set -e

REMOTE="dreamhost"
REMOTE_DIR="/home/dh_bb83pi/shadowoftheharvest.church/ChristmasProgram"
LOCAL_DIR="./dist"

echo "Starting deployment to $REMOTE..."
echo "Local directory: $LOCAL_DIR"
echo "Remote directory: $REMOTE_DIR"

# Check if local directory exists
if [ ! -d "$LOCAL_DIR" ]; then
  echo "Error: $LOCAL_DIR does not exist. Run 'npm run build' first."
  exit 1
fi

# Use scp to deploy
# For truly incremental deployments, use rsync on a Linux server
# Git Bash on Windows has difficulty with rsync dependencies
echo "Deploying files..."
scp -r "${LOCAL_DIR}/"* "${REMOTE}:${REMOTE_DIR}/"

echo "Deployment complete!"

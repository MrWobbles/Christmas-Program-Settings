#!/usr/bin/env bash
set -e

REMOTE="dreamhost"
REMOTE_DIR="/home/dh_bb83pi/shadowoftheharvest.church/ChristmasProgram"
LOCAL_DIR="./dist"

scp -r "${LOCAL_DIR}/"* "${REMOTE}:${REMOTE_DIR}/"

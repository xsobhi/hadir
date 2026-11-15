#!/bin/bash
# deploy.sh [--env]: build the web app, ship backend + dist to the OVH Windows server, restart the Hadir service.
# --env also uploads backend/.env as C:\hadir\hadir.env (with HADIR_COOKIE_SECURE=1). Login: ~/secrets/ovh-ds.json.
set -euo pipefail
cd "$(dirname "$0")/.."
CRED=/home/ubuntu/secrets/ovh-ds.json
H=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["host"])' "$CRED")
U=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["user"])' "$CRED")
SSHPASS=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["password"])' "$CRED"); export SSHPASS
OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 -o PubkeyAuthentication=no -o LogLevel=ERROR)

(cd web && npm run build >/dev/null)
mkdir -p deploy/out
tar -czf deploy/out/release.tgz --exclude='__pycache__' --exclude='backend/var' --exclude='backend/.env' \
  backend/hadir backend/requirements.txt web/dist deploy/windows
sshpass -e ssh "${OPTS[@]}" "$U@$H" "powershell -NoProfile -Command New-Item -ItemType Directory -Force -Path C:\\hadir | Out-Null"
sshpass -e scp -q "${OPTS[@]}" deploy/out/release.tgz "$U@$H:C:/hadir/release.tgz"
sshpass -e scp -q "${OPTS[@]}" deploy/windows/install.ps1 "$U@$H:C:/hadir/install.ps1"
if [[ ${1:-} == --env ]]; then
  sed 's/^HADIR_COOKIE_SECURE=.*/HADIR_COOKIE_SECURE=1/' backend/.env > deploy/out/hadir.env
  sshpass -e scp -q "${OPTS[@]}" deploy/out/hadir.env "$U@$H:C:/hadir/hadir.env"
  rm -f deploy/out/hadir.env
  sshpass -e ssh "${OPTS[@]}" "$U@$H" "icacls C:\\hadir\\hadir.env /inheritance:r /grant:r Administrators:F SYSTEM:F >NUL"
fi
sshpass -e ssh "${OPTS[@]}" "$U@$H" "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File C:\\hadir\\install.ps1" 2>&1 \
  | grep -v -E '^#< CLIXML|^<Objs |</Objs>$|<Obj S="progress"'

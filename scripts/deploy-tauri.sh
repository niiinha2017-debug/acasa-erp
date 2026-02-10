#!/usr/bin/env bash
set -euo pipefail

KEY_PATH="/c/Users/Julyana Duarte/.ssh/acasa_key"
EC2_HOST="ec2-user@54.164.55.32"
REMOTE_DIR="/var/www/aplicativo/updates/tauri"
REMOTE_APP_DIR="/var/www/aplicativo/erp"
BASE_URL="https://aplicativo.acasamarcenaria.com.br/erp"

PROJECT_DIR="/d/Sistema ERP/acasa-erp/frontend"
BUNDLE_DIR="$PROJECT_DIR/src-tauri/target/release/bundle/nsis"
VERSION_JSON="$PROJECT_DIR/src-tauri/tauri.conf.json"
VERSION=$(python - <<'PY'
import json,sys
from pathlib import Path
p=Path(r"d:/Sistema ERP/acasa-erp/frontend/src-tauri/tauri.conf.json")
data=json.loads(p.read_text(encoding="utf-8"))
ver=str(data.get("version","0.1.0"))
parts=ver.split(".")
if len(parts)!=3:
  parts=(ver+".0.0").split(".")[:3]
try:
  major,minor,patch=[int(x) for x in parts]
except:
  major,minor,patch=0,1,0
patch+=1
new=f"{major}.{minor}.{patch}"
data["version"]=new
p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(new)
PY
)

EXE_FILE="$BUNDLE_DIR/Acasa_${VERSION}_x64-setup.exe"
REMOTE_EXE_NAME="AcasaSetup.exe"
SIG_FILE="$EXE_FILE.sig"
LATEST_JSON="$BUNDLE_DIR/latest.json"

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" ]]; then
  echo "TAURI_SIGNING_PRIVATE_KEY_PASSWORD nao definido."

  exit 1
fi

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY_PATH:-}" ]]; then
  export TAURI_SIGNING_PRIVATE_KEY_PATH="/c/Users/Julyana Duarte/.ssh/tauri_private.key"
fi

if [[ ! -f "$TAURI_SIGNING_PRIVATE_KEY_PATH" ]]; then
  echo "Arquivo de chave privada nao encontrado: $TAURI_SIGNING_PRIVATE_KEY_PATH"
  exit 1
fi

# O bundler usa TAURI_SIGNING_PRIVATE_KEY (string) para gerar artifacts.
export TAURI_SIGNING_PRIVATE_KEY="$(cat "$TAURI_SIGNING_PRIVATE_KEY_PATH")"

cd "$PROJECT_DIR"

npm install

npm run tauri -- build --bundles "nsis"

unset TAURI_SIGNING_PRIVATE_KEY
npm run tauri -- signer sign \
  --private-key-path "/c/Users/Julyana Duarte/.ssh/tauri_private.key" \
  --password "$TAURI_SIGNING_PRIVATE_KEY_PASSWORD" \
  "$EXE_FILE"

SIZE_BYTES=$(stat -c %s "$EXE_FILE")
SIG_VALUE=$(cat "$SIG_FILE")

cat > "$LATEST_JSON" <<EOF
{
  "version": "${VERSION}",
  "notes": "Atualizacao do aplicativo",
  "pub_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platforms": {
    "windows-x86_64": {
      "url": "${BASE_URL}/${REMOTE_EXE_NAME}",
      "signature": "${SIG_VALUE}",
      "size": ${SIZE_BYTES}
    }
  }
}
EOF

scp -i "$KEY_PATH" "$EXE_FILE" "$EC2_HOST:/home/ec2-user/$REMOTE_EXE_NAME"
scp -i "$KEY_PATH" "$LATEST_JSON" "$EC2_HOST:/home/ec2-user/"

ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_DIR $REMOTE_APP_DIR && sudo mv /home/ec2-user/$REMOTE_EXE_NAME $REMOTE_APP_DIR/ && sudo mv /home/ec2-user/latest.json $REMOTE_DIR/ && sudo chown -R nginx:nginx $REMOTE_DIR $REMOTE_APP_DIR"

echo "OK: Atualizacao enviada para $BASE_URL/latest.json"

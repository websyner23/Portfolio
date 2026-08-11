#!/usr/bin/env bash
#
# WebSyner — one-shot installer for an Ubuntu server (built for AWS EC2).
#
# Installs Node.js and MongoDB, writes the environment files for all three
# apps with the server's real public address baked in, installs dependencies
# and seeds the database.
#
#   chmod +x installer.sh
#   ./installer.sh
#
# Optional overrides (all have sane defaults):
#
#   PUBLIC_HOST=app.example.com ./installer.sh   # domain instead of the EC2 IP
#   DATABASE_URL="mongodb+srv://…" ./installer.sh # MongoDB Atlas instead of local
#   SMTP_USER=… SMTP_PASS=… ./installer.sh        # enable outgoing email
#   CLOUDINARY_CLOUD_NAME=… ./installer.sh        # enable image uploads
#
set -euo pipefail

APP_DIR="${APP_DIR:-$PWD}"
NODE_MAJOR="${NODE_MAJOR:-20}"
MONGODB_MAJOR="${MONGODB_MAJOR:-8.0}"

# Ports each app listens on. Open these in the EC2 security group.
BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-5173}"

# Seeded super admin. Change the password after the first login.
SUPER_ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-admin@websyner.co}"
SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-admin12345}"

COMPANY_TZ="${COMPANY_TZ:-Asia/Dhaka}"

# ---------------------------------------------------------------- guards ----

if [[ "${EUID}" -eq 0 ]]; then
  echo "Please run this script as the ubuntu user, not as root. It will ask for sudo when needed."
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This installer is designed for Ubuntu/Debian-based Linux servers."
  exit 1
fi

source /etc/os-release
CODENAME="${VERSION_CODENAME:-}"

if [[ -z "$CODENAME" ]]; then
  echo "Could not detect Ubuntu codename."
  exit 1
fi

echo "Detected Ubuntu codename: $CODENAME"

if [[ "$CODENAME" != "noble" && "$CODENAME" != "jammy" && "$CODENAME" != "focal" ]]; then
  echo ""
  echo "Unsupported Ubuntu version for MongoDB direct installation: $CODENAME"
  echo "Please use one of the following for this project:"
  echo "  - Ubuntu 24.04 LTS: noble"
  echo "  - Ubuntu 22.04 LTS: jammy"
  echo "  - Ubuntu 20.04 LTS: focal"
  echo ""
  echo "Recommended: Ubuntu Server 24.04 LTS"
  exit 1
fi

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "No package.json in $APP_DIR — run this from the project root."
  exit 1
fi

# ------------------------------------------------------- public address ----
#
# Every URL the browser talks to must be the server's public address. Leaving
# these as localhost is the usual reason a cloud deploy "works" on the VM but
# fails from a laptop: the admin panel's API calls go nowhere and the backend's
# CORS whitelist rejects the real origin.

detect_public_host() {
  local ip=""

  # EC2 IMDSv2 first — IMDSv1 is disabled on newer instances.
  local token
  token="$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 300" \
    --max-time 3 2>/dev/null || true)"

  if [[ -n "$token" ]]; then
    ip="$(curl -fsS -H "X-aws-ec2-metadata-token: $token" \
      "http://169.254.169.254/latest/meta-data/public-ipv4" \
      --max-time 3 2>/dev/null || true)"
  fi

  # IMDSv1, for older instances.
  if [[ -z "$ip" ]]; then
    ip="$(curl -fsS "http://169.254.169.254/latest/meta-data/public-ipv4" \
      --max-time 3 2>/dev/null || true)"
  fi

  # Not on EC2 (or no public IP) — ask the internet.
  if [[ -z "$ip" ]]; then
    ip="$(curl -fsS https://api.ipify.org --max-time 5 2>/dev/null || true)"
  fi

  echo "$ip"
}

PUBLIC_HOST="${PUBLIC_HOST:-$(detect_public_host)}"

if [[ -z "$PUBLIC_HOST" ]]; then
  echo ""
  echo "Could not work out this server's public address."
  read -rp "Enter the public IP or domain browsers will use: " PUBLIC_HOST
fi

if [[ -z "$PUBLIC_HOST" ]]; then
  echo "A public address is required. Re-run with: PUBLIC_HOST=1.2.3.4 ./installer.sh"
  exit 1
fi

# A bare IP or hostname gets http://; a full URL is used as-is.
if [[ "$PUBLIC_HOST" =~ ^https?:// ]]; then
  BASE_URL="${PUBLIC_HOST%/}"
else
  BASE_URL="http://${PUBLIC_HOST}"
fi

BACKEND_URL="${BACKEND_URL:-${BASE_URL}:${BACKEND_PORT}}"
FRONTEND_URL="${FRONTEND_URL:-${BASE_URL}:${FRONTEND_PORT}}"
ADMIN_URL="${ADMIN_URL:-${BASE_URL}:${ADMIN_PORT}}"

echo "Public address: $BASE_URL"

# ------------------------------------------------------------- packages ----

echo "==> Cleaning old/broken MongoDB repositories"
sudo rm -f /etc/apt/sources.list.d/*mongo*
sudo rm -f /etc/apt/sources.list.d/*mongodb*
sudo rm -f /usr/share/keyrings/mongodb*.gpg
sudo rm -f /usr/share/keyrings/mongodb-*.gpg

echo "==> Updating apt packages"
sudo apt-get clean
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release build-essential

echo "==> Installing Node.js ${NODE_MAJOR}.x from NodeSource"
sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
  sudo gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | \
  sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null

sudo apt-get update -y
sudo apt-get install -y nodejs

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

echo "==> Installing MongoDB Community Server ${MONGODB_MAJOR}"

curl -fsSL "https://pgp.mongodb.com/server-${MONGODB_MAJOR}.asc" | \
  sudo gpg --yes -o "/usr/share/keyrings/mongodb-server-${MONGODB_MAJOR}.gpg" \
  --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGODB_MAJOR}.gpg ] https://repo.mongodb.org/apt/ubuntu ${CODENAME}/mongodb-org/${MONGODB_MAJOR} multiverse" | \
  sudo tee "/etc/apt/sources.list.d/mongodb-org-${MONGODB_MAJOR}.list" >/dev/null

sudo apt-get update -y
sudo apt-get install -y mongodb-org

echo "==> Starting MongoDB service"
sudo mkdir -p /var/lib/mongodb /var/log/mongodb
sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb

sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl enable mongod

# Wait for mongod to accept connections rather than guessing with a fixed sleep.
echo -n "Waiting for MongoDB"
for _ in $(seq 1 30); do
  if mongosh --quiet --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; then
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

if ! systemctl is-active --quiet mongod; then
  echo "MongoDB failed to start. Check: sudo journalctl -u mongod -n 50"
  exit 1
fi

echo "MongoDB service: $(systemctl is-active mongod)"
echo "MongoDB listens on 127.0.0.1 only — do not open port 27017 to the internet."

# ----------------------------------------------------------------- swap ----
#
# Three npm installs plus a Next.js build will exhaust a 1 GB t2.micro/t3.micro
# and the OOM killer takes out npm mid-install, which looks like a corrupt
# package rather than a memory problem.

TOTAL_MB="$(free -m | awk '/^Mem:/ {print $2}')"
if [[ "$TOTAL_MB" -lt 2048 ]] && ! sudo swapon --show | grep -q .; then
  echo "==> Only ${TOTAL_MB}MB RAM — adding a 2GB swap file so npm doesn't get OOM-killed"
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  if ! grep -q "^/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
fi

# ------------------------------------------------------------------ env ----

cd "$APP_DIR"

# Secrets are generated per install. Shipping fixed secrets in a repo would
# mean every deployment could forge each other's tokens.
gen_secret() { openssl rand -hex 32; }

JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-$(gen_secret)}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-$(gen_secret)}"
REVALIDATE_SECRET="${REVALIDATE_SECRET:-$(gen_secret)}"

DATABASE_URL="${DATABASE_URL:-mongodb://127.0.0.1:27017/websyner}"

CLOUDINARY_CLOUD_NAME="${CLOUDINARY_CLOUD_NAME:-}"
CLOUDINARY_API_KEY="${CLOUDINARY_API_KEY:-}"
CLOUDINARY_API_SECRET="${CLOUDINARY_API_SECRET:-}"

SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"
EMAIL_FROM="${EMAIL_FROM:-WebSyner <${SMTP_USER:-no-reply@websyner.co}>}"

echo "==> Writing environment files"

write_env() {
  local path="$1"
  local body="$2"

  if [[ -f "$path" ]]; then
    echo "  · $path already exists — left untouched"
    if grep -q "localhost" "$path" 2>/dev/null; then
      echo "    ⚠ it still points at localhost, which won't work from a browser."
      echo "      Delete it and re-run, or update the URLs to $BASE_URL"
    fi
    return
  fi

  printf '%s\n' "$body" > "$path"
  chmod 600 "$path"
  echo "  ✔ $path"
}

write_env "backend/.env" "# Generated by installer.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
NODE_ENV=production
PORT=${BACKEND_PORT}

DATABASE_URL=${DATABASE_URL}

BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=30d

SUPER_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL}
SUPER_ADMIN_PASSWORD=${SUPER_ADMIN_PASSWORD}

# Image uploads in the CMS need these; everything else works without them.
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}

# Without SMTP, emails are logged to the console instead of sent.
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
EMAIL_FROM=\"${EMAIL_FROM}\"

# These two are the CORS whitelist — they must match the origin the browser
# actually uses, or every admin request is rejected.
FRONTEND_URL=${FRONTEND_URL}
ADMIN_URL=${ADMIN_URL}

# Shared with the Next.js revalidation webhook; must match frontend/.env.local
REVALIDATE_SECRET=${REVALIDATE_SECRET}

COMPANY_TZ=${COMPANY_TZ}"

write_env "frontend/.env.local" "# Generated by installer.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
# Server-side fetching stays on the loopback — faster, and it keeps working
# even if the public address changes.
API_URL=http://127.0.0.1:${BACKEND_PORT}/api/v1

# Used by the browser (contact form, quote form, meeting booking), so this one
# has to be the public address.
NEXT_PUBLIC_API_URL=${BACKEND_URL}/api/v1

# Must match REVALIDATE_SECRET in backend/.env
REVALIDATE_SECRET=${REVALIDATE_SECRET}"

write_env "admin/.env" "# Generated by installer.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
# The admin panel runs entirely in the browser, so both of these must be the
# public address — localhost here means every API call fails for real users.
VITE_API_URL=${BACKEND_URL}/api/v1
VITE_SOCKET_URL=${BACKEND_URL}"

# ---------------------------------------------------------- dependencies ----

echo "==> Installing project dependencies"
npm install
npm run install:all

echo "==> Seeding database"
npm run seed

# --------------------------------------------------------------- summary ----

echo ""
echo "============================================================"
echo " Installation complete"
echo "============================================================"
echo "Node:            $(node -v)"
echo "npm:             $(npm -v)"
echo "MongoDB service: $(systemctl is-active mongod)"
echo "Public address:  $BASE_URL"
echo ""
echo "Open these ports in the EC2 security group (inbound, source 0.0.0.0/0):"
echo "  ${FRONTEND_PORT}  website"
echo "  ${ADMIN_PORT}  admin panel"
echo "  ${BACKEND_PORT}  API"
echo "Leave 27017 closed — MongoDB is only reachable from this machine."
echo ""
echo "Start everything:"
echo "  npm run dev"
echo ""
echo "An SSH session ends when you disconnect, which stops the apps. To keep"
echo "them running:"
echo "  sudo npm install -g pm2"
echo "  pm2 start npm --name websyner -- run dev"
echo "  pm2 save && pm2 startup"
echo ""
echo "URLs"
echo "  Website:      ${FRONTEND_URL}"
echo "  Admin panel:  ${ADMIN_URL}"
echo "  API health:   ${BACKEND_URL}/api/v1/health"
echo ""
echo "Login"
echo "  ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}"
echo "  Change this password after signing in (Profile → Change password)."
echo ""
if [[ -z "$SMTP_USER" ]]; then
  echo "Note: SMTP is not configured, so lead notifications and meeting"
  echo "      confirmations are logged rather than emailed. Add SMTP_USER and"
  echo "      SMTP_PASS to backend/.env and restart to enable them."
fi
if [[ -z "$CLOUDINARY_CLOUD_NAME" ]]; then
  echo "Note: Cloudinary is not configured, so CMS image uploads are disabled."
  echo "      Add the CLOUDINARY_* values to backend/.env and restart."
fi
echo ""
echo "If you re-run this installer, existing .env files are kept as they are."

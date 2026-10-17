#!/usr/bin/env bash
# ═════════════════════════════════════════════════════════════════════
# KaushalLens & SkillGuard AI — Automated AWS EC2 Deployment Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS
# ═════════════════════════════════════════════════════════════════════

set -e

echo "🚀 [1/6] Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git ffmpeg

echo "🐳 [2/6] Installing Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
fi

echo "📦 [3/6] Configuring Environment..."
mkdir -p storage/uploads storage/annotated storage/results

cat << 'EOF' > .env.local
SKILLGUARD_AI_BASE_URL=http://ai-backend:8000
SKILLGUARD_AI_ENABLED=true
EOF

cat << 'EOF' > backend/.env
SKILLGUARD_DEVICE=cpu
SKILLGUARD_CONFIDENCE_THRESHOLD=0.35
SKILLGUARD_NMS_IOU_THRESHOLD=0.70
SKILLGUARD_SAMPLE_EVERY_SECONDS=0.5
SKILLGUARD_WINDOW_SECONDS=10
SKILLGUARD_TOLERANCE_PERCENT=0.20
SKILLGUARD_TOLERANCE_MIN_PEOPLE=2
SKILLGUARD_STORAGE_DIR=storage
SKILLGUARD_ALLOWED_ORIGINS=*
EOF

echo "🏗️ [4/6] Building and Launching Containers with Docker Compose..."
sudo docker compose down --remove-orphans || true
sudo docker compose up -d --build

echo "⏳ [5/6] Waiting for Services to initialize..."
sleep 15

echo "🩺 [6/6] Verifying Service Health..."
if curl -s http://localhost:8000/health | grep -q '"status":"ok"'; then
    echo "✅ FastAPI AI Microservice is HEALTHY on port 8000!"
else
    echo "⚠️ Warning: AI service not responding yet. Checking docker logs:"
    sudo docker logs skillguard-ai-backend --tail 25
fi

echo ""
echo "================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "• Web App & Command Centre: http://<YOUR_EC2_PUBLIC_IP>:3000"
echo "• AI Video Microservice:    http://<YOUR_EC2_PUBLIC_IP>:8000/docs"
echo "• Health Endpoint:          http://<YOUR_EC2_PUBLIC_IP>:8000/health"
echo "================================================================="

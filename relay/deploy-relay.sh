#!/bin/bash
# fixit-relay 部署脚本 —— 把传话小妹送上 Cloudflare
# 用法：./deploy-relay.sh
# 前提：已 wrangler login；钥匙已用 secret 存进 Cloudflare（第一次要手动，见 README）
set -e
cd "$(dirname "$0")"

echo "[1/3] 部署 Worker..."
wrangler deploy

echo "[2/3] 检查钥匙是否已配置..."
wrangler secret list | grep -q ZHIPU_API_KEY && echo "钥匙已在" || echo ">>> 还没配钥匙：跑 wrangler secret put ZHIPU_API_KEY <<<"

echo "[3/3] 线上健康检查..."
sleep 5
URL=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' <<< "$(wrangler deployments list 2>/dev/null)" | head -1)
echo "小妹地址: ${URL:-看上面的 deploy 输出}"

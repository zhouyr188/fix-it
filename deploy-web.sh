#!/bin/bash
# Fix It 网站发布脚本（防白屏三件套：nojekyll + 相对路径 + 真浏览器验收）
# 2026-11-09 起：网页版走 Cloudflare 中转站（relay/），
#   打包时设 APP_WEB_BUILD=1 → 钥匙不烘进网页包（app.config.js 里判断）
set -e
cd ~/Desktop/gfj
echo "[1/5] 打包（网页模式：不带钥匙）..."
APP_WEB_BUILD=1 npx expo export --platform web --output-dir dist 2>&1 | tail -1
# 安全检查：钥匙敢混进包里就直接报错停下，不许带钥匙出门
if grep -rq "$(awk -F= '/^ZHIPU_API_KEY=/{printf "%s", $2}' .env)" dist/; then
  echo "!!! 安全检查失败：钥匙出现在网页包里，禁止发布 !!!"; exit 1
fi
echo "[2/5] 资产路径改相对路径..."
sed -i '' 's|"/_expo/|"./_expo/|g; s|"/favicon.ico|"./favicon.ico|g' dist/index.html
echo "[3/5] 组装部署目录..."
rm -rf /tmp/ghp-deploy && cp -R dist /tmp/ghp-deploy
cd /tmp/ghp-deploy
git init -q && git checkout -q -b main
touch .nojekyll
git add -A
git commit -qm "web release: $(date '+%m-%d %H:%M')"
git remote add origin git@github.com:zhouyr188/fix-it.git
echo "[4/5] 推送 gh-pages..."
git push --force origin main:gh-pages 2>&1 | tail -1
echo "[5/5] 触发构建并等待..."
gh api repos/zhouyr188/fix-it/pages/builds -X POST --jq '.status'
sleep 75
JS=$(curl -s --max-time 12 https://zhouyr188.github.io/fix-it/ | grep -oE 'src="\./[^"]+"' | sed 's/src="\.\///;s/"//')
curl -s -o /dev/null -w "线上JS资产: %{http_code}\n" --max-time 12 "https://zhouyr188.github.io/fix-it/$JS"

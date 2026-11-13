// ============================================================
// fixit-relay —— Fix It 网页版的「传话小妹」
// ============================================================
// 为什么需要她？
//   1. 浏览器从 github.io 直接喊智谱 API，门卫（CORS）不放行 → 出不了题
//   2. 以前钥匙烘在网页包里，谁都能扒走 → 不安全
//   传话小妹住在 Cloudflare：网页喊她 → 她带钥匙喊智谱 → 把话原样带回来。
//   钥匙只在她口袋里（环境变量），网页和 GitHub 上都不再出现。
//   手机 App 不走她，还是直连，一行不动。

// 只服务我们自己两家：网页版（github.io）和本机调试（localhost）
const ALLOWED_ORIGINS = [
  'https://zhouyr188.github.io',
  'http://localhost:8081',
  'http://localhost:19006',
];

// 智谱的地址（和 App 里 ai.js 用的同一个）
const ZHIPU_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// CORS 头：告诉浏览器「我允许你读我的回复」
function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://zhouyr188.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // ① 预检请求：门卫问话，直接答「放行」，不带任何业务
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ② 只收 POST，其他姿势一律挡回
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: '只收 POST' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // ③ 把网页发来的 JSON 原样读进来
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: '请求体不是合法 JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // ④ 带着口袋里的钥匙去喊智谱（钥匙在 Cloudflare 环境变量 ZHIPU_API_KEY）
    const upstream = await fetch(ZHIPU_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (env.ZHIPU_API_KEY || ''),
      },
      body: JSON.stringify(body),
    });

    // ⑤ 智谱的回话原样转交（成功是 200，出错也把真实状态码带回去，方便排查）
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};

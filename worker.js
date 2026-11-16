/**
 * 装懂同伴默认 AI 服务代理（Cloudflare Worker）
 *
 * 部署后在 Worker Settings -> Variables and Secrets 中设置：
 *   SILICONFLOW_API_KEY  (Secret)
 *   DEFAULT_MODEL       (普通变量，可选，默认 DeepSeek-V3)
 *
 * 不要把真实 API Key 写入此文件或 GitHub。
 */
const ALLOWED_ORIGIN = "*"; // 正式商用时建议替换为 GitHub Pages 的精确域名

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/v1/chat/completions") {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: cors });
    }
    if (!env.SILICONFLOW_API_KEY) {
      return new Response(JSON.stringify({ error: "Default AI service is not configured." }), { status: 503, headers: cors });
    }
    let payload;
    try { payload = await request.json(); }
    catch { return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: cors }); }
    const allowed = {
      model: payload.model || env.DEFAULT_MODEL || "deepseek-ai/DeepSeek-V3",
      messages: Array.isArray(payload.messages) ? payload.messages : [],
      temperature: typeof payload.temperature === "number" ? payload.temperature : 0.7,
      stream: false
    };
    if (!allowed.messages.length) {
      return new Response(JSON.stringify({ error: "messages is required." }), { status: 400, headers: cors });
    }
    try {
      const upstream = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.SILICONFLOW_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(allowed)
      });
      const body = await upstream.text();
      return new Response(body, { status: upstream.status, headers: cors });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Upstream request failed." }), { status: 502, headers: cors });
    }
  }
};

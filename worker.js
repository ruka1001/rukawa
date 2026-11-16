/**
 * 装懂同伴默认 AI 服务代理（Cloudflare Worker）
 * Secret: SILICONFLOW_API_KEY
 * 不要把真实 API Key 写入代码或 GitHub。
 */
const ALLOWED_ORIGIN = "https://ruka1001.github.io";

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    const jsonHeaders = { ...cors, "Content-Type": "application/json; charset=utf-8" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (!env.SILICONFLOW_API_KEY) {
      return new Response(JSON.stringify({ error: "Default AI service is not configured." }), { status: 503, headers: jsonHeaders });
    }

    // 将模型列表请求安全地转发给硅基流动，Key 不会暴露给浏览器。
    if (request.method === "GET" && url.pathname === "/v1/models") {
      try {
        const upstream = await fetch("https://api.siliconflow.cn/v1/models", {
          headers: { "Authorization": "Bearer " + env.SILICONFLOW_API_KEY }
        });
        return new Response(await upstream.text(), { status: upstream.status, headers: jsonHeaders });
      } catch {
        return new Response(JSON.stringify({ error: "Unable to retrieve model list." }), { status: 502, headers: jsonHeaders });
      }
    }

    if (request.method !== "POST" || url.pathname !== "/v1/chat/completions") {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: jsonHeaders });
    }

    let payload;
    try { payload = await request.json(); }
    catch { return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: jsonHeaders }); }

    const allowed = {
      model: payload.model || "deepseek-ai/DeepSeek-V3",
      messages: Array.isArray(payload.messages) ? payload.messages : [],
      temperature: typeof payload.temperature === "number" ? payload.temperature : 0.7,
      stream: false
    };
    if (!allowed.messages.length) {
      return new Response(JSON.stringify({ error: "messages is required." }), { status: 400, headers: jsonHeaders });
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
      return new Response(await upstream.text(), { status: upstream.status, headers: jsonHeaders });
    } catch {
      return new Response(JSON.stringify({ error: "Upstream request failed." }), { status: 502, headers: jsonHeaders });
    }
  }
};

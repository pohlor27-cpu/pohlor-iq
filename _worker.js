/**
 * Cloudflare Worker: IQ Option Gateway & Auth Server
 * Supports:
 * 1. Email & Password Login API (/api/login)
 * 2. WebSocket Upstream Proxy with Origin: https://iqoption.com (/ws or upgrade)
 * 3. Static Assets serving
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        }
      });
    }

    // 1. Email & Password Login API
    if (url.pathname === "/api/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const identifier = body.email || body.identifier;
        const password = body.password;

        if (!identifier || !password) {
          return new Response(JSON.stringify({ code: "error", message: "กรุณาระบุอีเมลและรหัสผ่าน" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            }
          });
        }

        const authResp = await fetch("https://auth.iqoption.com/api/v2/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          },
          body: JSON.stringify({ identifier, password })
        });

        const authData = await authResp.json();
        return new Response(JSON.stringify(authData), {
          status: authResp.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ code: "error", message: err.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        });
      }
    }

    // 2. WebSocket Proxy
    if (request.headers.get("Upgrade") === "websocket" || url.pathname === "/ws") {
      try {
        const upstreamResponse = await fetch("https://iqoption.com/echo/websocket", {
          headers: {
            "Upgrade": "websocket",
            "Origin": "https://iqoption.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          }
        });

        const upstreamWs = upstreamResponse.webSocket;
        if (!upstreamWs) {
          return new Response("Upstream IQ Option server did not accept WebSocket", { status: 502 });
        }

        upstreamWs.accept({ allowHalfOpen: true });

        const pair = new WebSocketPair();
        const clientWs = pair[0];
        const serverWs = pair[1];

        serverWs.accept({ allowHalfOpen: true });

        serverWs.addEventListener("message", (event) => {
          try {
            if (upstreamWs.readyState === WebSocket.OPEN) {
              upstreamWs.send(event.data);
            }
          } catch (e) {}
        });

        upstreamWs.addEventListener("message", (event) => {
          try {
            if (serverWs.readyState === WebSocket.OPEN) {
              serverWs.send(event.data);
            }
          } catch (e) {}
        });

        serverWs.addEventListener("close", (event) => {
          try { upstreamWs.close(event.code, event.reason); } catch (e) {}
        });

        upstreamWs.addEventListener("close", (event) => {
          try { serverWs.close(event.code, event.reason); } catch (e) {}
        });

        return new Response(null, {
          status: 101,
          webSocket: clientWs
        });
      } catch (err) {
        return new Response("Gateway Error: " + err.message, { status: 500 });
      }
    }

    // 3. Serve static assets if deployed with assets
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("pohlor IQ Option Gateway & Auth Server is RUNNING 🟢", { status: 200 });
  }
};

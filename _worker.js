/**
 * Cloudflare Worker / Pages Function: _worker.js
 * Automatically runs on https://pohlor-iq.pohlor27.workers.dev/
 * Bridges WebSocket /ws to IQ Option with Origin: https://iqoption.com
 * Serves all static HTML/CSS/JS assets seamlessly.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If request is WebSocket or /ws
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

    // Serve static files if env.ASSETS is available
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("pohlor IQ Option Gateway Running", { status: 200 });
  }
};

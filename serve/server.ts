import { serve } from "bun"

const PROXY_TARGET = process.env.PROXY_TARGET || "https://agenthosting.app"
const PORT = Number(process.env.PORT || 3000)
const RELEASES_DIR = process.env.RELEASES_DIR || "./releases"

const STATIC_FILES: Record<string, { path: string; type: string }> = {
  "/install": { path: "./public/install", type: "text/plain; charset=utf-8" },
  "/install.ps1": { path: "./public/install.ps1", type: "text/plain; charset=utf-8" },
}

console.log(`AgentHosting CLI server on :${PORT}`)
console.log(`Proxy target: ${PROXY_TARGET}`)
console.log(`Releases dir: ${RELEASES_DIR}`)

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname

    // Serve static install scripts
    const staticFile = STATIC_FILES[path]
    if (staticFile) {
      const file = Bun.file(staticFile.path)
      if (await file.exists()) {
        return new Response(file, {
          headers: { "content-type": staticFile.type, "cache-control": "no-store" },
        })
      }
    }

    // Serve release files
    if (path.startsWith("/releases/")) {
      const filePath = `${RELEASES_DIR}${path}`
      const file = Bun.file(filePath)
      if (await file.exists()) {
        const ext = path.endsWith(".tar.gz") ? "application/gzip" : path.endsWith(".zip") ? "application/zip" : "text/plain"
        return new Response(file, {
          headers: { "content-type": ext, "cache-control": "public, max-age=3600" },
        })
      }
      return new Response("Not found", { status: 404 })
    }

    // Health check
    if (path === "/health" || path === "/api/health") {
      return new Response(JSON.stringify({ status: "ok", service: "code.agenthosting.app" }), {
        headers: { "content-type": "application/json" },
      })
    }

    // Proxy everything else to the main site
    const targetUrl = `${PROXY_TARGET}${req.url.substring(url.origin.length)}`
    try {
      const proxyRes = await fetch(targetUrl, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        redirect: "manual",
      })
      const headers = new Headers(proxyRes.headers)
      headers.delete("transfer-encoding")
      return new Response(proxyRes.body, {
        status: proxyRes.status,
        statusText: proxyRes.statusText,
        headers,
      })
    } catch {
      return new Response("Service temporarily unavailable", {
        status: 502,
        headers: { "content-type": "text/plain" },
      })
    }
  },
})

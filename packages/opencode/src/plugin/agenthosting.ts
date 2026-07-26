import { createServer } from "http"
import { exec } from "child_process"
import type { Hooks, PluginInput } from "@mimo-ai/plugin"
import { Log } from "../util"

const log = Log.create({ service: "agenthosting" })

const PLATFORM_URL = process.env.AGENTHOSTING_URL || "https://agenthosting.app"
const API_BASE = `${PLATFORM_URL}/api/cli`
const PROVIDER_ID = "agenthosting"

function openBrowser(url: string) {
  if (process.env.CI || process.env.NODE_ENV === "test") return
  const command =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`
  exec(command, (error) => {
    if (error) log.warn("could not open browser", { error })
  })
}

function browserOAuth() {
  const server = createServer()
  const listening = new Promise<void>((resolve, reject) => {
    server.listen(0, () => resolve())
    server.on("error", reject)
  })

  const result = listening.then(() => {
    const addr = server.address()
    const port = typeof addr === "object" && addr ? addr.port : 0
    const redirectUri = `http://localhost:${port}/callback`
    const authUrl = `${PLATFORM_URL}/api/cli/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`
    log.info("starting browser oauth", { port })
    openBrowser(authUrl)

    return new Promise<{ token: string } | { error: string }>((resolve) => {
      const timeout = setTimeout(() => {
        server.close()
        resolve({ error: "Authorization timeout (5 minutes)" })
      }, 5 * 60 * 1000)

      server.on("request", (req, res) => {
        const url = new URL(req.url || "/", `http://localhost:${port}`)
        if (url.pathname !== "/callback") {
          res.writeHead(404)
          res.end()
          return
        }
        const token = url.searchParams.get("token")
        if (!token) {
          res.writeHead(400, { "Content-Type": "text/html" })
          res.end("<html><body><h1>Authorization failed</h1></body></html>")
          clearTimeout(timeout)
          server.close()
          resolve({ error: "No token received" })
          return
        }
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end("<html><body><h1>Authorization successful!</h1><p>You can close this window.</p></body></html>")
        clearTimeout(timeout)
        server.close()
        resolve({ token })
      })
    })
  })

  result.catch(() => {})
  return result
}

type AgentInfo = {
  id: string
  name: string
  status: string
  modelProvider: string | null
  modelName: string | null
}

async function fetchAgents(token: string): Promise<AgentInfo[]> {
  const res = await fetch(`${API_BASE}/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { agents: AgentInfo[] }
  return data.agents
}

export async function AgentHostingAuthPlugin(_input: PluginInput): Promise<Hooks> {
  return {
    config: async (input) => {
      input.provider ??= {}
      input.provider[PROVIDER_ID] ??= {
        name: "AgentHosting",
        api: `${API_BASE}/v1`,
        npm: "@ai-sdk/openai-compatible",
        models: {
          login: {
            name: "Login to agenthosting.app",
            api: { id: "login", url: `${API_BASE}/v1`, npm: "@ai-sdk/openai-compatible" },
            capabilities: {
              temperature: false,
              reasoning: false,
              attachment: false,
              tool_call: false,
              modalities: { input: ["text"], output: ["text"] },
            },
            cost: { input: 0, output: 0 },
            limit: { context: 200000, output: 16384 },
          },
        },
      }
      if (!input.model) input.model = `${PROVIDER_ID}/login`
    },
    auth: {
      provider: PROVIDER_ID,
      async loader(getAuth) {
        const auth = (await getAuth()) as { type: string; key?: string }
        if (auth?.type !== "api" || !auth.key) return {}
        return {
          baseURL: `${API_BASE}/v1`,
          apiKey: auth.key,
        }
      },
      methods: [
        {
          label: "Browser login to agenthosting.app",
          type: "oauth" as const,
          authorize: async () => {
            const pending = browserOAuth()
            return {
              url: `${PLATFORM_URL}/dashboard`,
              method: "auto" as const,
              instructions: "Complete authorization in your browser.",
              callback: async () => {
                const result = await pending
                if ("error" in result) {
                  log.error("oauth failed", { error: result.error })
                  return { type: "failed" as const }
                }
                return { type: "success" as const, key: result.token }
              },
            }
          },
        },
      ],
    },
    provider: {
      id: PROVIDER_ID,
      async models(_provider, ctx) {
        const auth = ctx.auth as { type: string; key?: string } | undefined
        if (!auth || auth.type !== "api" || !auth.key) {
          return {
            login: {
              id: "login",
              providerID: PROVIDER_ID,
              name: "Login to agenthosting.app (run: ah providers login agenthosting)",
              family: "agenthosting",
              api: { id: "login", url: `${API_BASE}/v1`, npm: "@ai-sdk/openai-compatible" },
              capabilities: {
                temperature: false,
                reasoning: false,
                attachment: false,
                toolcall: false,
                input: { text: true, audio: false, image: false, video: false, pdf: false },
                output: { text: true, audio: false, image: false, video: false, pdf: false },
              },
              cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
              limit: { context: 200000, output: 16384 },
              status: undefined,
              options: {},
              headers: {},
            },
          }
        }
        const agentList = await fetchAgents(auth.key).catch(() => [])
        const models: Record<string, any> = {}
        for (const agent of agentList) {
          if (agent.status !== "running") continue
          models[agent.id] = {
            id: agent.id,
            providerID: PROVIDER_ID,
            name: agent.name,
            family: "agenthosting",
            api: {
              id: agent.id,
              url: `${API_BASE}/v1`,
              npm: "@ai-sdk/openai-compatible",
            },
            capabilities: {
              temperature: true,
              reasoning: true,
              attachment: false,
              toolcall: true,
              input: { text: true, audio: false, image: false, video: false, pdf: false },
              output: { text: true, audio: false, image: false, video: false, pdf: false },
            },
            cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
            limit: { context: 200000, output: 16384 },
            status: undefined,
            options: {},
            headers: {},
          }
        }
        if (Object.keys(models).length === 0) {
          models["login"] = {
            id: "login",
            providerID: PROVIDER_ID,
            name: "No running agents found — create one at agenthosting.app",
            family: "agenthosting",
            api: { id: "login", url: `${API_BASE}/v1`, npm: "@ai-sdk/openai-compatible" },
            capabilities: {
              temperature: false,
              reasoning: false,
              attachment: false,
              toolcall: false,
              input: { text: true, audio: false, image: false, video: false, pdf: false },
              output: { text: true, audio: false, image: false, video: false, pdf: false },
            },
            cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
            limit: { context: 200000, output: 16384 },
            status: undefined,
            options: {},
            headers: {},
          }
        }
        return models
      },
    },
    "chat.headers": async (input, output) => {
      if (input.model.providerID !== PROVIDER_ID) return
      output.headers["X-AgentHosting-Source"] = "cli"
    },
  }
}

process.env.AGENTHOSTING = "1"
process.env.MIMOCODE_DEFAULT_PROVIDER = "agenthosting"

if (!process.env.AGENTHOSTING_URL) {
  process.env.AGENTHOSTING_URL = "https://agenthosting.app"
}

await import("@mimo-ai/cli/index")

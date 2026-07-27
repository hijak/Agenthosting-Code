# AgentHosting CLI

A terminal-native AI coding assistant powered by your [AgentHosting.app](https://agenthosting.app) agents.

AgentHosting CLI brings your hosted agents into your local development workflow. Authenticate via OAuth, select an agent, and code with full local tool execution (file editing, shell commands, git) backed by your agent's brain — including memory, personality, and configured LLM.

## Quick Start

### Install

**macOS / Linux:**
```bash
curl -fsSL https://agenthosting.app/install | bash
```

**Windows (PowerShell):**
```powershell
irm https://agenthosting.app/install.ps1 | iex
```

**npm:**
```bash
npm install -g @agenthosting/cli
```

### Authenticate

```bash
ah providers login agenthosting
```

This opens your browser to `dashboard.agenthosting.app/cli-authorize`. Sign in, and your CLI token is delivered automatically (or copy-paste it for SSH/remote sessions).

### Select an Agent & Code

```bash
ah
```

Your running agents appear as selectable models. Pick one and start coding — the agent's memory, personality, and LLM configuration come through automatically.

Changes run against the directory where you launched `ah`. To deliberately use
the hosted agent's persistent workspace instead, select the `remote` model
variant in the TUI.

## How It Works

```
CLI (local tools)  →  AgentHosting backend  →  Hermes runtime  →  LLM
                          ↓
                    Agent memory (mem0)
                    Agent soul/personality
                    Agent session state
```

- **Local tools**: File editing, bash/shell, git operations, MCP servers — all execute on your machine
- **Remote brain**: Your agent's LLM, memory, and personality are served through the Hermes runtime
- **OAuth auth**: Browser-based OAuth to agenthosting.app (Clerk). Supports paste-token fallback for headless/SSH

## Features

- **Agent selection**: Running agents appear as models in the provider list
- **Full memory**: Agent retrieves facts and memories via mem0 vector search
- **Personality**: Agent soul and system prompt are injected via the Hermes runtime
- **Local tools**: Read/write files, run bash, manage git — all locally
- **TUI**: Full terminal UI with syntax highlighting, diffs, themes
- **Andromeda theme**: Default theme based on the [Andromeda Design System](https://aicanvas.me/design-systems/andromeda)
- **Multiple agents**: Switch between agents mid-session
- **SSH/remote support**: Paste-token auth flow for headless environments

## Commands

| Command | Description |
|---------|-------------|
| `ah` | Start the TUI (default) |
| `ah run "message"` | Non-interactive single prompt |
| `ah providers login agenthosting` | Authenticate via browser OAuth |
| `ah providers list` | Show configured providers |
| `ah models` | List available models/agents |
| `ah serve` | Start headless HTTP server |
| `ah session list` | List sessions |
| `ah upgrade` | Update to latest version |

## Configuration

Config files are searched in order:
1. `./agenthosting.jsonc` (project-level)
2. `~/.config/agenthosting/agenthosting.jsonc` (global)

```jsonc
{
  "$schema": "https://agenthosting.app/docs/config.json",
  "model": "agenthosting/login"
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENTHOSTING_API_URL` | `https://api.agenthosting.app` | Backend API URL |
| `AGENTHOSTING_DASHBOARD_URL` | `https://dashboard.agenthosting.app` | Dashboard URL for OAuth |
| `AGENTHOSTING_WORKSPACE` | `local` | Default tool workspace (`local` or `remote`) |

## Development

```bash
bun ci                    # Install deps (frozen lockfile)
bun run dev               # Run CLI in dev mode
bun turbo typecheck       # Typecheck all packages
bun lint                  # Run oxlint
```

Tests run from package directories:
```bash
cd packages/opencode
bun test
```

## Architecture

| Package | Description |
|---------|-------------|
| `packages/opencode` | Core CLI engine (TUI, tools, sessions, providers) |
| `packages/agenthosting` | AgentHosting integration (entry point, OAuth plugin) |
| `packages/plugin` | Plugin system SDK |

### AgentHosting Plugin

The AgentHosting auth plugin (`packages/opencode/src/plugin/agenthosting.ts`) registers the `agenthosting` provider and handles:

- Browser OAuth flow to `dashboard.agenthosting.app/cli-authorize`
- Agent listing (running agents appear as models)
- LLM proxying through the Hermes runtime (memory, soul, tools)
- Session management (`cli-{agentId}` stable session per agent)

## License

MIT

import { describe, expect, test } from "bun:test"
import { AgentHostingAuthPlugin, agentHostingWorkspace } from "../../src/plugin/agenthosting"

describe("agentHostingWorkspace", () => {
  test("uses the local workspace by default", () => {
    expect(agentHostingWorkspace(undefined, undefined)).toBe("local")
  })

  test("allows the hosted workspace through configuration", () => {
    expect(agentHostingWorkspace(undefined, "remote")).toBe("remote")
  })

  test("the remote model variant overrides the default", () => {
    expect(agentHostingWorkspace("remote", "local")).toBe("remote")
  })

  test("the chat hook sends the selected workspace mode", async () => {
    const hooks = await AgentHostingAuthPlugin({} as never)
    const output = { headers: {} as Record<string, string> }
    await hooks["chat.headers"]?.(
      {
        model: { providerID: "agenthosting" },
        message: { model: { providerID: "agenthosting", modelID: "agent-id", variant: "remote" } },
      } as never,
      output,
    )
    expect(output.headers["X-AgentHosting-Source"]).toBe("cli")
    expect(output.headers["X-AgentHosting-Workspace"]).toBe("remote")
  })
})

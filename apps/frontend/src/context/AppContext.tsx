import type { Workspace } from "@local-agent-orchestrator/types"
import { createContext } from "react"

export const AppContext = createContext<{
    workspaces: Workspace[],
    socket: WebSocket | null,
    setWorkspaces: any
}>({
    workspaces: [],
    socket: null,
    setWorkspaces: []
})
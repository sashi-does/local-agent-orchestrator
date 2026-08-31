import "./index.css";
import { useSocket } from "./hooks/useSocket";
import { AppContext } from "./context/AppContext";
import { useContext, useEffect, useMemo, useState } from "react";
import type { OutgoingMessageType, Workspace } from "@local-agent-orchestrator/types";

function normalizeWorkspace(entry: any): Workspace {
  const workspace = entry?.workspace ?? entry ?? {};
  const rawSessions = Array.isArray(entry?.sessions)
    ? entry.sessions
    : Array.isArray(workspace?.sessions)
      ? workspace.sessions
      : [];

  return {
    id: String(workspace?._id ?? workspace?.id ?? ""),
    name: workspace?.name ?? workspace?.path?.split("/").pop() ?? "",
    path: workspace?.path ?? "",
    sessions: rawSessions.map((session: any) => ({
      id: String(session?._id ?? session?.id ?? ""),
      messages: Array.isArray(session?.conversation)
        ? session.conversation
        : Array.isArray(session?.messages)
          ? session.messages
          : [],
    })),
  };
}

function upsertWorkspace(list: Workspace[], incoming: Workspace): Workspace[] {
  const normalized = {
    ...incoming,
    id: incoming.id || `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    path: incoming.path || "",
    name: incoming.name || incoming.path?.split("/").pop() || "",
    sessions: incoming.sessions ?? [],
  };

  const existingIndex = list.findIndex((w) => {
    if (w.id && normalized.id && w.id === normalized.id) return true;
    return w.path === normalized.path;
  });

  if (existingIndex >= 0) {
    return list.map((w, index) => (index === existingIndex ? normalized : w));
  }

  return [...list, normalized];
}

export function App() {
  const { socket, loading } = useSocket();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string>("");

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? workspaces[0] ?? null,
    [workspaces, selectedWorkspaceId],
  );

  useEffect(() => {
    if (!loading && socket) {
      socket.onmessage = (event: MessageEvent) => {
        const parsedData = JSON.parse(event.data) as OutgoingMessageType & {
          payload?: { workspaces?: Workspace[] };
        };

        if (parsedData.type === "init") {
          const nextWorkspaces = Array.isArray(parsedData.workspaces)
            ? parsedData.workspaces.map(normalizeWorkspace)
            : [];
          setWorkspaces(nextWorkspaces);
          if (nextWorkspaces[0]?.id) {
            setSelectedWorkspaceId(nextWorkspaces[0].id);
          }
        } else if (parsedData.type === "workspace-created") {
          setWorkspaces((workspaces) => upsertWorkspace(workspaces, parsedData.payload as Workspace));
        } else if (parsedData.type === "session-created") {
          const { id, workspaceId } = parsedData.payload;
          setWorkspaces((current) =>
            current.map((workspace) =>
              workspace.id === workspaceId
                ? {
                    ...workspace,
                    sessions: [
                      ...((workspace.sessions ?? []).filter((session) => session.id !== id)),
                      { id, messages: [] },
                    ],
                  }
                : workspace,
            ),
          );
          setSelectedWorkspaceId(workspaceId);
          setExpandedWorkspaceId(workspaceId);
          setSelectedSessionId(id);
        }
      };
    }
  }, [socket, loading]);

  useEffect(() => {
    if (!selectedWorkspaceId && workspaces[0]?.id) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [selectedWorkspaceId, workspaces]);

  function createSessionFor(workspace: Workspace) {
    setSelectedWorkspaceId(workspace.id);
    setExpandedWorkspaceId(workspace.id);
    setSelectedSessionId("");
    socket?.send(
      JSON.stringify({ type: "create-session", payload: { workspaceId: workspace.id } }),
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-sm text-neutral-500">
        loading…
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ workspaces, socket, setWorkspaces }}>
      <div className="flex h-screen bg-[#0a0a0b] text-neutral-200 antialiased">
        <Sidebar
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          selectedSessionId={selectedSessionId}
          expandedWorkspaceId={expandedWorkspaceId}
          onSelectWorkspace={(id) => {
            setSelectedWorkspaceId((current) => (current === id ? "" : id));
            setExpandedWorkspaceId((current) => (current === id ? "" : id));
          }}
          onSelectSession={setSelectedSessionId}
          onCreateSession={() => selectedWorkspace && createSessionFor(selectedWorkspace)}
        />

        <ChatPanel
          workspace={selectedWorkspace}
          sessionId={selectedSessionId}
          onCreateSession={() => selectedWorkspace && createSessionFor(selectedWorkspace)}
        />
      </div>
    </AppContext.Provider>
  );
}

function Sidebar({
  workspaces,
  selectedWorkspaceId,
  selectedSessionId,
  expandedWorkspaceId,
  onSelectWorkspace,
  onSelectSession,
  onCreateSession,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  selectedSessionId: string;
  expandedWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
}) {
  const { socket, setWorkspaces } = useContext(AppContext);
  const [path, setPath] = useState("");

  function addWorkspace() {
    const trimmedPath = path.trim();
    if (!trimmedPath) return;

    const optimisticWorkspace: Workspace = {
      id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      path: trimmedPath,
      name: trimmedPath.split("/").pop() ?? trimmedPath,
      sessions: [],
    };

    setWorkspaces((w: Workspace[]) => upsertWorkspace(w, optimisticWorkspace));
    onSelectWorkspace(optimisticWorkspace.id);
    setPath("");
    socket?.send(
      JSON.stringify({
        type: "create-workspace",
        payload: { path: trimmedPath, name: optimisticWorkspace.name },
      }),
    );
  }

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-white/[0.06]">
      <div className="flex justify-center px-4 pt-8 pb-6">
        <span
          style={{ 
            fontFamily: "'Silkscreen', monospace"
          }}
          className="text-[32px] tracking-[-0.16em] leading-none bg-gradient-to-b from-white via-white to-neutral-400 bg-clip-text text-transparent"
        >
          LOCALCODE
        </span>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5">
          <div className="flex flex-1 items-center rounded-lg border border-white/[0.08] bg-white/[0.02] focus-within:border-white/20">
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addWorkspace();
              }}
              placeholder="Add a workspace path…"
              className="w-full bg-transparent px-3 py-2 text-[13px] text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
            />
          </div>
          <button
            onClick={addWorkspace}
            disabled={!path.trim()}
            className="shrink-0 rounded-lg cursor-pointer bg-neutral-100 px-3 py-2 text-[13px] font-medium text-neutral-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-neutral-500"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[11px] text-neutral-600">Workspaces</span>
        <span className="text-[11px] text-neutral-600">{workspaces.length}</span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {workspaces.length === 0 ? (
          <div className="px-2 py-6 text-center text-[12px] text-neutral-600">No workspaces yet</div>
        ) : (
          workspaces.map((workspace) => {
            const isExpanded = expandedWorkspaceId === workspace.id;
            const isSelected = selectedWorkspaceId === workspace.id;
            const sessions = workspace.sessions ?? [];

            return (
              <div key={workspace.id} className="overflow-hidden rounded-lg">
                <button
                  onClick={() => onSelectWorkspace(workspace.id)}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                    isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                  ].join(" ")}
                >
                  <svg
                    viewBox="0 0 16 16"
                    className={[
                      "h-3 w-3 shrink-0 text-neutral-600 transition-transform duration-200",
                      isExpanded ? "rotate-90" : "",
                    ].join(" ")}
                    fill="none"
                  >
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  <div className="min-w-0 flex-1 cursor-pointer">
                    <div className="truncate text-[13px] text-neutral-200">{workspace.name}</div>
                  </div>

                  {sessions.length > 0 && (
                    <span className="shrink-0 text-[11px] text-neutral-600">{sessions.length}</span>
                  )}
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="ml-5 space-y-0.5 border-l border-white/[0.06] py-1 pl-3">
                      {sessions.filter(Boolean).map((session) => {
                        if (!session?.id) return null;
                        const isActive = selectedSessionId === session.id;

                        return (
                          <button
                            key={session.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSession(session.id);
                            }}
                            className={[
                              "flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors",
                              isActive ? "bg-white/[0.06] text-neutral-100" : "text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300",
                            ].join(" ")}
                          >
                            <span className="text-[12px]">#{String(session.id).slice(-4)}</span>
                            <span className="text-[11px] text-neutral-600">{(session.messages ?? []).length}</span>
                          </button>
                        );
                      })}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkspace(workspace.id);
                          onCreateSession();
                        }}
                        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-neutral-600 transition-colors hover:bg-white/[0.03] hover:text-neutral-400"
                      >
                        <span className="text-[13px] leading-none">+</span> New session
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function ChatPanel({
  workspace,
  sessionId,
  onCreateSession,
}: {
  workspace: Workspace | null;
  sessionId: string;
  onCreateSession: () => void;
}) {
  const session = workspace?.sessions?.find((item) => item.id === sessionId) ?? null;

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-neutral-200">
            {workspace?.name ?? "No workspace selected"}
          </div>
          {workspace?.path && (
            <div className="truncate text-[11px] text-neutral-600">{workspace.path}</div>
          )}
        </div>

        {/* <button
          onClick={onCreateSession}
          disabled={!workspace}
          className="shrink-0 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-[12px] text-neutral-400 transition-colors hover:border-white/20 hover:text-neutral-200 disabled:opacity-30"
        >
          New session
        </button> */}
      </header>

      {!session || !sessionId ? (
        <div className="flex flex-1 items-center justify-center px-8 text-center">
          <div className="text-[13px] text-neutral-600">
            {workspace ? "Select or create a session to begin" : "Add a workspace to get started"}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {(session.messages ?? []).length > 0 ? (
              (session.messages ?? []).map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={[
                    "max-w-[75%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    message.role === "user"
                      ? "ml-auto bg-white/[0.08] text-neutral-100"
                      : "bg-white/[0.03] text-neutral-300",
                  ].join(" ")}
                >
                  {message.payload?.message ?? "No content"}
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-neutral-600">
                Start the conversation
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-white/[0.06] p-4">
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 focus-within:border-white/20">
              <input
                placeholder="Type your message…"
                className="flex-1 bg-transparent text-[13px] text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
              />
              <button className="shrink-0 rounded-md bg-neutral-100 px-3 py-1.5 text-[12px] font-medium text-neutral-900 transition hover:bg-white">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
import z from "zod"

export const createWorkspaceSchema = z.object({
    path: z.string(),
})

export type createWorkspaceSchemaType = z.infer<typeof createWorkspaceSchema>

export const createSessionSchema = z.object({
    workspaceId: z.string(),
    
})

export type createSessionSchemaType = z.infer<typeof createSessionSchema>;

export const addMessageSchema = z.object({
    sessionId: z.string(),
    message: z.string()
})

export type addMessageSchemaType = z.infer<typeof addMessageSchema>;

export type incomingMessageType = {
    type: "create-session",
    payload: createSessionSchemaType
} | {
    type: "create-workspace"
    payload: createWorkspaceSchemaType
} | {
    type: "add-message",
    payload: addMessageSchemaType
};

export * from "./incoming"
export * from "./outgoing"
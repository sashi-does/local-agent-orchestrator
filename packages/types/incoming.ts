import { z } from "zod";

export const createWorkspaceSchema = z.object({
    path: z.string().min(1),
    name: z.string().optional(),
});

export type CreateWorkspaceSchemaType =
    z.infer<typeof createWorkspaceSchema>;

export const createSessionSchema = z.object({
    workspaceId: z.string()
});

export type CreateSessionSchemaType =
    z.infer<typeof createSessionSchema>;

export const addMessageSchema = z.object({
    sessionId: z.string(),
    message: z.string()
});

export type AddMessageSchemaType =
    z.infer<typeof addMessageSchema>;

export type IncomingMessageType =
    | {
        type: "create-session";
        payload: CreateSessionSchemaType;
    }
    | {
        type: "create-workspace";
        payload: CreateWorkspaceSchemaType;
    }
    | {
        type: "add-message";
        payload: AddMessageSchemaType;
    };
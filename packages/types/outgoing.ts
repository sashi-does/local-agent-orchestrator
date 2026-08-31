import { z } from "zod";

// validator for backend
export const workspaceCreatedSchema = z.object({
    id: z.string(),
    path: z.string(),
    name: z.string()
});

// type for frontend
export type WorkspaceCreatedSchemaType =
    z.infer<typeof workspaceCreatedSchema>;

export const sessionCreatedSchema = z.object({
    id: z.string(),
    workspaceId: z.string()
});

export type SessionCreatedSchemaType =
    z.infer<typeof sessionCreatedSchema>;

export const messageAddedSchema = z.object({
    sessionId: z.string(),
    message: z.string()
});

export type MessageAddedSchemaType =
    z.infer<typeof messageAddedSchema>;

export type OutgoingMessageType =
    | {
        type: "session-created";
        payload: SessionCreatedSchemaType;
    }
    | {
        type: "workspace-created";
        payload: WorkspaceCreatedSchemaType;
    }
    | {
        type: "message-added";
        payload: MessageAddedSchemaType;
    }
    | {
        type: "init";
        workspaces: Workspace[];
    };

export type Workspace = {
    id: string,
    name: string, 
    path: string,
    sessions: Session[]
}

export type Session = {
    id: string,
    messages: Message[] 
}

export type Message = {
    role: "user",
    payload: {
        message: string
    }
} | {
    role: "assistant",
    payload: any
};
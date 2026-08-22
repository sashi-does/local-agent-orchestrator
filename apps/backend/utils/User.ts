import WebSocket from "ws";
import {
    type IncomingMessageType,
    createWorkspaceSchema,
    type OutgoingMessageType,
    createSessionSchema,
    addMessageSchema
} from "@local-agent-orchestrator/types/common";
import { uuid } from "uuidv4";
import { SessionModel, WorkspaceModel } from "@local-agent-orchestrator/db/client";

export class User {
    public id: string;
    private socket: WebSocket;

    constructor(socket: WebSocket) {
        this.id = uuid();
        this.socket = socket;
    }

    async sendMessage(payload: OutgoingMessageType) {
        this.socket.send(JSON.stringify(payload));
    }

    async handleIncomingMessage(
        msg: IncomingMessageType
    ): Promise<OutgoingMessageType> {
        if (msg.type === "create-workspace") {
            const { success, data } = createWorkspaceSchema.safeParse(msg.payload);

            if (!success) {
                throw new Error("Incorrect workspace schema");
            }

            const workspace = await WorkspaceModel.create({
                path: data.path,
                name: data.path.split("/").pop()
            });

            return {
                type: "workspace-created",
                payload: {
                    path: workspace.path as string
                }
            };
        }

        if (msg.type === "create-session") {
            const { success, data } = createSessionSchema.safeParse(msg.payload);

            if (!success) {
                throw new Error("Incorrect session schema");
            }

            const session = await SessionModel.create({
                workspace: data.workspaceId,
                conversation: []
            });

            return {
                type: "session-created",
                payload: {
                    workspaceId: session.workspace.toString()
                }
            };
        }

        if (msg.type === "add-message") {
            const { success, data } = addMessageSchema.safeParse(msg.payload);

            if (!success) {
                throw new Error("Incorrect message schema");
            }

            await SessionModel.updateOne(
                { _id: data.sessionId },
                { $push: { conversation: data.message } }
            );

            return {
                type: "message-added",
                payload: {
                    sessionId: data.sessionId,
                    message: data.message
                }
            };
        }

        throw new Error("Unknown message type");
    }
}
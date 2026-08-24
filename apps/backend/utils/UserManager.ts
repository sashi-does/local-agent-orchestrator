import { SessionModel, WorkspaceModel } from "@local-agent-orchestrator/db/client";
import { User } from "./User";
import WebSocket from "ws";

// singleton
export class UserManager {
    private users: User[]
    private static instance: UserManager;
    private constructor() {
        this.users = [];
    }

    static getInstance() {
        if(UserManager.instance)
            return UserManager.instance;
        
        return UserManager.instance = new UserManager();
    }

    async addUser(socket: WebSocket) {
        const user = new User(socket);
        this.users.push(user);

        

        socket.on("message", async (msg) => {
            try {
                const parsedMessage = JSON.parse(msg.toString());
                const responsePayload = await user.handleIncomingMessage(parsedMessage);
                await user.sendMessage(responsePayload);

            }
            catch(e: any) {
                console.log("Incorrect format");

            }
        });

        socket.on("close", () => {
            this.users = this.users.filter(ws => ws.id != user.id);
        }) 

        const workspaces = await WorkspaceModel.find();
        const sessions = await SessionModel.find();

        const sessionsByWorkspace = new Map();

        for (const session of sessions) {
            const workspaceId = session.workspace.toString();

            if (!sessionsByWorkspace.has(workspaceId)) {
                sessionsByWorkspace.set(workspaceId, []);
            }

            sessionsByWorkspace.get(workspaceId).push(session);
        }

        const response = workspaces.map((workspace) => ({
            workspace,
            sessions: sessionsByWorkspace.get(
                workspace._id.toString()
            ) || []
        }));

        console.log(response);
        
        socket.send(JSON.stringify({
            type: "init",
            workspaces: response
        }));

    }
}
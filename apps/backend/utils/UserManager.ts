import { User } from "./User";
import WebSocket from "ws";

// singleton
export class UserManager {
    private users: User[]
    private static instance: UserManager;
    constructor() {
        this.users = [];
    }

    static getInstance() {
        if(UserManager.instance)
            return UserManager.instance;
        
        return UserManager.instance = new UserManager();
    }

    addUser(socket: WebSocket) {
        const user = new User(socket);
        this.users.push(user);

        socket.on("message", async (msg: string) => {
            try {
                const parsedMessage = JSON.parse(msg);
                const responsePayload = await user.handleIncomingMessage(parsedMessage);
                await user.sendMessage(responsePayload);

            }
            catch(e: any) {
                console.log("Incorrect format");

            }
        }) 

        socket.on("close", () => {
            this.users = this.users.filter(ws => ws.id != user.id);
        }) 

    }
}
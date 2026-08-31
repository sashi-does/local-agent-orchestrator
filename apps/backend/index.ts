import { dbConnect, WorkspaceModel, SessionModel } from "@local-agent-orchestrator/db/client";
import { WebSocketServer } from "ws";
import { UserManager } from "./utils/UserManager";
import { User } from "./utils/User";


const ws = new WebSocketServer({
    port: 8080
});

console.log("starting to connect!!")
await dbConnect(process.env.URI!);
console.log("db connected!!")


const userManager = UserManager.getInstance();

ws.on("connection", async (socket) => {
    console.log("Connected!!!");
    await userManager.addUser(socket);
});


// 1. create message Types
// 2. create stateful ws
// 3. store the message in the db (of the respective session id of the workspace)

// 4. allow user to select the model (typical model adaptor)
// 5. ...
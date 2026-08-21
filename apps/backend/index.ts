import { dbConnect, WorkspaceModel } from "@local-agent-orchestrator/db/client";
import type { Socket } from "bun";
import { Types } from "mongoose";
import { WebSocketServer } from "ws";


const ws = new WebSocketServer({
    port: 8080
});

console.log("starting to connect!!")
await dbConnect(process.env.URI!);
console.log("db connected!!")


ws.on("connection", (socket) => { 
    
    // console.log("Connecetd!!!") 
    
    socket.on("message", (data: String) => {
        console.log(data);
        console.log("damnnn")
        WorkspaceModel.create({
            name: "demo", 
            path: "/root"
        })
    })
})  


// 1. create message Types
// 2. create stateful ws
// 3. store the message in the db (of the respective session id of the workspace)

// 4. allow user to select the model (typical model adaptor)
// 5. ...
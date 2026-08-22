import mongoose from "mongoose";

const Workspace = new mongoose.Schema({
    name: String, 
    path: String
});

const Session = new mongoose.Schema({
    conversation: [Object],
    workspace: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'Workspace',
        required: true
    }
});

export const WorkspaceModel = mongoose.model("Workspace", Workspace);
export const SessionModel =  mongoose.model("Session", Session);



export const dbConnect: (uri: string) => Promise<typeof mongoose> = (uri: String) => {
     if (!uri) {
        throw new Error("URI is not defined");
    }

    return mongoose.connect(uri as string);
}
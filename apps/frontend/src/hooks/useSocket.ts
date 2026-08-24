import { useEffect, useState } from "react";

export function useSocket() {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");

        socket.onopen = () => {
            console.log("Connected to WebSocket");

            socket.onmessage = (data) => {
                console.log(data);
            }

            setWs(socket);
            setLoading(false);
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            socket.close();
        };
    }, []);

    return {
        socket: ws,
        loading
    };
}
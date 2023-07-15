import { WebSocketServer, WebSocket } from 'ws';

export const configureWebsockets = () => {
    const wss = new WebSocketServer({ port: 8080 });

    wss.on('connection', (ws) => {
        ws.on('error', console.error);

        ws.on('message', (data) => {
            console.log('received: %s', data);
        });

        ws.send('something');
    });

    return {
        broadcast: (data: any, isBinary: boolean) =>
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data, { binary: isBinary });
                }
            }),
    };
};

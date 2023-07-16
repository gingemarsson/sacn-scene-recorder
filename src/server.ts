import express from 'express';
import next from 'next';
import { dmxReceived, getLastReceivedDmxDataForUniverse } from './business-logic/redux/currentDmxSlice';
import { store } from './business-logic/redux/store';
import { configureWebsockets } from './business-logic/websockets';
import { ReceiverConfiguration, SenderConfiguration } from './models';
import { configureReceiver } from './sacn/sacnReceiver';
import { configureSender } from './sacn/sacnSender';

const port = parseInt(process?.env?.PORT ?? '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // Configure next js
    //
    server.all('/api/getCurrentState', (_req, res) => {
        res.send(store.getState());
    });

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });

    // Configure sACN
    //
    const receiverConfiguration: ReceiverConfiguration = {
        universes: [1, 2, 3, 4],
        appName: 'sACN Scene Recorder',
        onReceive: (dmxUniverseState) => {
            store.dispatch(dmxReceived(dmxUniverseState));
        },
    };
    configureReceiver(receiverConfiguration);

    const senderConfiguration: SenderConfiguration = {
        universes: [1, 2, 3, 4],
        appName: 'sACN Scene Recorder',
        priority: 90,
        getDmxDataToSendForUniverse: (universeId: number) =>
            getLastReceivedDmxDataForUniverse(store.getState(), universeId),
    };
    const { startSending, stopSending } = configureSender(senderConfiguration);
    startSending();

    const websocketsData = configureWebsockets(store);

    // Websocket proof of concept
    const timer = setInterval(async () => {
        websocketsData.broadcast(JSON.stringify(getLastReceivedDmxDataForUniverse(store.getState(), 1)), false);
    }, 1000);
});

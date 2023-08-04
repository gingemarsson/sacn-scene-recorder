import express from 'express';
import next from 'next';
import { configureMqtt } from './business-logic/mqtt';
import { dmxReceived } from './business-logic/redux/currentDmxSlice';
import { getDmxDataToSendForUniverse, getSceneStatus, reloadScenes } from './business-logic/redux/scenesSlice';
import { observeStore, store } from './business-logic/redux/store';
import { configureWebsockets } from './business-logic/websockets';
import { readScenes, saveScenes } from './lib/database';
import { ReceiverConfiguration, SenderConfiguration } from './models';
import { configureReceiver } from './sacn/sacnReceiver';
import { configureSender } from './sacn/sacnSender';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const logPrefix = '[INFO]';
const appName = 'sACN Scene Recorder';

app.prepare().then(async () => {
    const port: number = parseInt(process?.env?.PORT ?? '3000', 10);
    const webSocketsPort: number = parseInt(process?.env?.NEXT_PUBLIC_WEBSOCKETS_PORT ?? '8080', 10);
    const universes: number[] = JSON.parse(process.env.NEXT_PUBLIC_UNIVERSES_JSON ?? '[1]');
    const priority: number = parseInt(process.env.NEXT_PUBLIC_PRIO ?? '90');

    const mqttTopic: string = process.env.MQTT_TOPIC ?? '';
    const mqttBrokerUri: string = process.env.MQTT_BROKER ?? '';
    const mqttBrokerUser: string | undefined = process.env.MQTT_BROKER_USER ?? undefined;
    const mqttBrokerPassword: string | undefined = process.env.MQTT_BROKER_PASSWORD ?? undefined;
    const mqttSourceId: string = process.env.MQTT_SOURCE_ID ?? 'sacn-scene-recorder';

    const server = express();

    // Load state from SQLite
    //
    await reloadScenesFromDataBase();

    // Configure sACN
    //
    const receiverConfiguration: ReceiverConfiguration = {
        universes: universes,
        appName: appName,
        onReceive: (dmxUniverseState) => {
            store.dispatch(dmxReceived(dmxUniverseState));
        },
    };
    configureReceiver(receiverConfiguration);

    const senderConfiguration: SenderConfiguration = {
        universes: universes,
        appName: appName,
        priority: priority,
        getDmxDataToSendForUniverse: (universeId: number) => getDmxDataToSendForUniverse(store.getState(), universeId),
    };
    const { startSending, stopSending, sendOnce } = configureSender(senderConfiguration, () =>
        console.log(`> sACN ready with priority ${priority} for universes ${universes.join(',')}`),
    );
    startSending();

    // Configure WebSockets
    //
    const websocketsData = configureWebsockets(store, webSocketsPort, () =>
        console.log(`> WebSockets ready on port ${webSocketsPort}`),
    );

    // Configure MQTT
    const mqttData = configureMqtt(
        store,
        mqttTopic,
        mqttBrokerUri,
        mqttBrokerUser,
        mqttBrokerPassword,
        mqttSourceId,
        () => console.log(`> MQTT ready with broker '${mqttBrokerUri}' and topic '${mqttTopic}'`),
    );

    // Configure broadcast on scene changes.
    observeStore(
        store,
        (x) => x.scenes,
        async (scenes) => {
            sendOnce();
            websocketsData.broadcast(JSON.stringify({ scenes: scenes, sceneStatus: getSceneStatus(scenes) }), false);
            mqttData.sendStatusWithDebounce();
            await saveScenes(scenes);
        },
    );

    // Configure next js
    //
    server.all('/api/getCurrentState', (_req, res) => {
        res.send(store.getState());
    });

    server.all('/api/stopSending', (_req, res) => {
        stopSending();
        console.log(logPrefix, 'Stop sending sACN');
        res.send('Stopped');
    });

    server.all('/api/startSending', (_req, res) => {
        startSending();
        console.log(logPrefix, 'Start sending sACN');
        res.send('Started');
    });

    server.all('/api/resetWebSockets', async (_req, res) => {
        websocketsData.closeAll();
        console.log(logPrefix, 'Close all WebSockets');
        res.send('WebSockets closed');
    });

    server.all('/api/reloadFromDatabase', async (_req, res) => {
        await reloadScenesFromDataBase();
        res.send('Reloaded');
    });

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, () => {
        console.log(`> Webserver ready on http://localhost:${port}`);
    });
});

async function reloadScenesFromDataBase() {
    console.log(logPrefix, 'Reloading configuration');
    store.dispatch(reloadScenes(await readScenes()));
}

import { Store } from 'redux';
import { WebSocketServer, WebSocket } from 'ws';
import { getLastReceivedDmxDataForUniverse } from './redux/currentDmxSlice';
import {
    addScene,
    deleteScene,
    disableScene,
    enableScene,
    removeDmxFromScene,
    setMasterOfScene,
    storeDmxToScene,
    updateScene,
} from './redux/scenesSlice';
import { RootState } from './redux/store';
import { getScenes } from './redux/scenesSlice';
import { WebsocketCommand } from '../models';

const logPrefix = '[WS CMD]';

export const configureWebsockets = (store: Store<RootState>, port: number, onConfigured: () => void) => {
    const wss = new WebSocketServer({ port });

    wss.on('connection', (ws) => {
        ws.on('error', console.error);

        ws.on('message', (data) => {
            handleIncomingMessage(store, data.toString());
        });

        ws.send(JSON.stringify(getScenes(store.getState())));
    });

    onConfigured();

    return {
        broadcast: (data: any, isBinary: boolean) =>
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data, { binary: isBinary });
                }
            }),
        closeAll: () => wss.clients.forEach((x) => x.close()),
    };
};

const handleIncomingMessage = (store: Store<RootState>, data: string) => {
    let command: WebsocketCommand | null | undefined;

    try {
        command = JSON.parse(data);
    } catch (e) {
        console.log(logPrefix, 'Invalid JSON (exception)');
        return;
    }

    if (!command) {
        console.log(logPrefix, 'Invalid JSON (undefined)');
        return;
    }

    switch (command.type) {
        case 'enable':
            if (!command.sceneId) {
                break;
            }
            store.dispatch(enableScene(command.sceneId));
            console.log(logPrefix, 'Enable', command.sceneId);
            break;

        case 'disable':
            if (!command.sceneId) {
                break;
            }
            store.dispatch(disableScene(command.sceneId));
            console.log(logPrefix, 'Disable', command.sceneId);
            break;

        case 'master':
            if (!command.sceneId) {
                break;
            }
            if (!command.value) {
                break;
            }
            store.dispatch(setMasterOfScene({ sceneId: command.sceneId, value: command.value }));
            console.log(logPrefix, 'Master', command.sceneId);
            break;

        case 'add':
            if (!command.metadata) {
                break;
            }
            store.dispatch(addScene(command.metadata));
            console.log(logPrefix, 'Add');
            break;

        case 'delete':
            if (!command.sceneId) {
                break;
            }
            store.dispatch(deleteScene(command.sceneId));
            console.log(logPrefix, 'Delete', command.sceneId);
            break;

        case 'update':
            if (!command.sceneId) {
                break;
            }
            if (!command.metadata) {
                break;
            }
            store.dispatch(updateScene({ id: command.sceneId, ...command.metadata }));
            console.log(logPrefix, 'Update', command.sceneId);
            break;

        case 'storeDmx':
            if (!command.sceneId) {
                break;
            }
            if (!command.universes) {
                break;
            }

            const dmxToStore = command.universes.map(
                (universeId) => getLastReceivedDmxDataForUniverse(store.getState(), universeId) ?? {},
            );

            store.dispatch(storeDmxToScene({ id: command.sceneId, dmx: dmxToStore }));
            console.log(logPrefix, 'StoreDmx', command.sceneId);
            break;

        case 'removeDmx':
            if (!command.sceneId) {
                break;
            }
            if (!command.universes) {
                break;
            }

            const dmxToRemove = command.universes.map(
                (universeId) => getLastReceivedDmxDataForUniverse(store.getState(), universeId) ?? {},
            );
            store.dispatch(removeDmxFromScene({ id: command.sceneId, dmx: dmxToRemove }));
            console.log(logPrefix, 'RemoveDmx', command.sceneId);
            break;

        default:
            console.log(logPrefix, 'Unknown command');
    }
};

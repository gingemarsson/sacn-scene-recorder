import { MqttCommand, MqttReply } from '@/models';
import { connect } from 'mqtt';
import { Store } from 'redux';
import { disableScene, enableScene, setMasterOfScene } from './redux/scenesSlice';
import { RootState } from './redux/store';

const logPrefix = '[MQTT CMD]';

export const configureMqtt = (
    store: Store<RootState>,
    topic: string,
    mqttBrokerUri: string,
    sourceId: string,
    onConfigured: () => void,
) => {
    let client = connect(mqttBrokerUri);

    client.on('connect', () => {
        client.subscribe(topic, (err) => {
            if (err) {
                console.log('Mqtt error');
            } else {
                onConfigured();
            }
        });
    });

    client.on('message', (topic, message) => {
        let command: MqttCommand | null | undefined;

        try {
            command = JSON.parse(message.toString());
        } catch (e) {
            console.log(logPrefix, 'Invalid JSON (exception)');
            return;
        }

        if (!command) {
            console.log(logPrefix, 'Invalid JSON (undefined)');
            return;
        }

        // Do not act on our own messages
        if (command['source-id'] === sourceId) {
            return;
        }

        switch (command.command) {
            case 'status':
                const reply: MqttReply = { status: { scenes: store.getState().scenes }, 'source-id': sourceId };
                client.publish(topic, JSON.stringify(reply));
                break;
            case 'enable':
                if (!command.sceneId) {
                    break;
                }
                store.dispatch(enableScene(command.sceneId));
                store.dispatch(setMasterOfScene({ sceneId: command.sceneId, value: 100 }));
                console.log(logPrefix, 'Enable', command.sceneId);
                break;

            case 'disable':
                if (!command.sceneId) {
                    break;
                }
                store.dispatch(disableScene(command.sceneId));
                store.dispatch(setMasterOfScene({ sceneId: command.sceneId, value: 1 }));
                console.log(logPrefix, 'Disable', command.sceneId);
                break;

            default:
                console.log(logPrefix, 'Unknown command');
        }
    });
};

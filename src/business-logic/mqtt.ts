import { MqttCommand, MqttReply } from '@/models';
import debounce from 'debounce';
import { connect } from 'mqtt';
import { Store } from 'redux';
import {
    disableScene,
    enableScene,
    getScenes,
    getSceneStatus,
    setMasterOfScene,
    toggleScene,
} from './redux/scenesSlice';
import { RootState } from './redux/store';

const logPrefix = '[MQTT CMD]';

export const configureMqtt = (
    store: Store<RootState>,
    mqttTopic: string,
    mqttBrokerUri: string,
    sourceId: string,
    onConfigured: () => void,
) => {
    let client = connect(mqttBrokerUri);

    client.on('connect', () => {
        client.subscribe('#', (err) => {
            if (err) {
                console.log('Mqtt error');
            } else {
                onConfigured();
            }
        });
    });

    client.on('message', (topic, message) => {
        // Ignore other topics
        if (topic !== mqttTopic && !getScenes(store.getState()).some((s) => s.mqttToggleTopic === topic)) {
            return;
        }

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

        // Check if it is the main topic
        //
        if (topic === mqttTopic) {
            switch (command.command) {
                case 'status':
                    sendStatus();
                    break;
                case 'enable':
                    if (!command.sceneId) {
                        break;
                    }
                    store.dispatch(enableScene(command.sceneId));
                    store.dispatch(setMasterOfScene({ sceneId: command.sceneId, value: 100 }));
                    sendStatus();
                    console.log(logPrefix, 'Enable', command.sceneId);
                    break;

                case 'disable':
                    if (!command.sceneId) {
                        break;
                    }
                    store.dispatch(disableScene(command.sceneId));
                    store.dispatch(setMasterOfScene({ sceneId: command.sceneId, value: 1 }));
                    sendStatus();
                    console.log(logPrefix, 'Disable', command.sceneId);
                    break;

                default:
                    console.log(logPrefix, 'Unknown command');
            }

            return;
        }

        // Check if topic is configured on any scene
        //
        getScenes(store.getState()).forEach((scene) => {
            if (topic === scene.mqttToggleTopic && (command as any)[scene.mqttTogglePath] === scene.mqttToggleValue) {
                store.dispatch(toggleScene(scene.id));
                sendStatus();
            }
        });
    });

    const sendStatus = () => {
        const reply: MqttReply = {
            status: { sceneStatus: getSceneStatus(getScenes(store.getState())) },
            'source-id': sourceId,
        };
        client.publish(mqttTopic, JSON.stringify(reply));
    };

    // To limit MQTT spam, we use a 1s debounce here.
    const sendStatusWithDebounce = debounce(sendStatus, 1000);
    return { sendStatus, sendStatusWithDebounce };
};

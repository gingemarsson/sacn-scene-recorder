import { Receiver } from 'sacn';
import { ReceiverConfiguration, ReceiverData } from '../models';
import { listToMap } from './utils';

// Config
//
const priorityTimeOutInterval = 15000;

// Listener
//
export const configureReceiver = (configuration: ReceiverConfiguration) => {
    const sACN = new Receiver({
        universes: configuration.universes,
    });

    // Init receiver data structure
    const receiverData: ReceiverData = {
        universeData: listToMap(configuration.universes, () => ({ dmx: {}, priority: 0, lastReceived: 0 })),
        configuration: configuration,
    };
    listenForDmx(sACN, receiverData);

    return receiverData;
};

const listenForDmx = async (reciver: Receiver, receiverData: ReceiverData) => {
    reciver.on('packet', async (packet) => {
        if (!receiverData.configuration.universes.some((x) => x === packet.universe)) {
            // If universe is not recognised, return.
            return;
        }

        if (packet.sourceName === receiverData.configuration.appName) {
            // If sender is this application, return.
            return;
        }

        const metadata = receiverData.universeData[packet.universe];
        if (
            metadata &&
            metadata.priority > packet.priority &&
            metadata.lastReceived > Date.now() - priorityTimeOutInterval
        ) {
            // If prio is lower than stored prio, and not enough time has elapsed, return.
            return;
        }

        receiverData.universeData[packet.universe] = {
            dmx: packet.payload,
            priority: packet.priority,
            lastReceived: Date.now(),
            sender: packet.sourceName,
        };
    });
};

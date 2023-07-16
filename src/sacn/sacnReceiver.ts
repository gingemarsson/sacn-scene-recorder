import { Receiver } from 'sacn';
import { ReceiverConfiguration } from '../models';
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

    // Create receiver metadata structure to keep track of priority
    const receiverMetadata: Record<number, { priority: number; lastReceived: number }> = listToMap(
        configuration.universes,
        () => ({
            priority: 0,
            lastReceived: 0,
        }),
    );

    // Listen for packets
    sACN.on('packet', async (packet) => {
        if (!configuration.universes.some((x) => x === packet.universe)) {
            // If universe is not recognised, return.
            return;
        }

        if (packet.sourceName === configuration.appName) {
            // If sender is this application, return.
            return;
        }

        const metadata = receiverMetadata[packet.universe];
        if (
            metadata &&
            metadata.priority > packet.priority &&
            metadata.lastReceived > Date.now() - priorityTimeOutInterval
        ) {
            // If prio is lower than stored prio, and not enough time has elapsed, return.
            return;
        }

        const dmxMetadata = {
            priority: packet.priority,
            lastReceived: Date.now(),
        };

        const dmxData = {
            universeId: packet.universe,
            dmx: packet.payload,
            sender: packet.sourceName,
            ...dmxMetadata,
        };

        receiverMetadata[packet.universe] = dmxMetadata;
        configuration.onReceive(dmxData);
    });
};

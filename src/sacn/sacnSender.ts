import { Sender } from 'sacn';
import { SenderConfiguration } from '../models';
import { listToMap } from './utils';

// Config
//
const sendInterval = 65;

// Sender
//
export const configureSender = (senderConfiguration: SenderConfiguration, onConfigured: () => void) => {
    const sACNSenders = listToMap(
        senderConfiguration.universes,
        (universeId) =>
            new Sender({
                universe: universeId,
                reuseAddr: true,
            }),
    );

    let timer: NodeJS.Timer | null = null;

    const startSending = () => {
        if (timer) {
            return;
        }

        timer = setInterval(async () => {
            send(senderConfiguration, sACNSenders);
        }, sendInterval);
    };

    const stopSending = () => {
        if (!timer) {
            return;
        }
        clearInterval(timer);
        timer = null;
    };

    onConfigured();

    return {
        startSending,
        stopSending,
        sendOnce: () => send(senderConfiguration, sACNSenders),
    };
};

const send = (senderConfiguration: SenderConfiguration, sACNSenders: Record<number, Sender>) => {
    senderConfiguration.universes.forEach(async (universeId) => {
        const sender = sACNSenders[universeId];
        const dataToSend = senderConfiguration.getDmxDataToSendForUniverse(universeId) ?? {};
        await sender.send({
            payload: dataToSend,
            sourceName: senderConfiguration.appName,
            priority: senderConfiguration.priority,
        });
    });
};

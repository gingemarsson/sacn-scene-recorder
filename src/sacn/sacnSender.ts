import { Receiver, Sender } from 'sacn';
import { ReceiverConfiguration, ReceiverData, SenderConfiguration } from './models';
import { listToMap } from './utils';

// Config
//
const sendInterval = 1000;

// Sender
//
export const configureSender = (senderConfiguration: SenderConfiguration) => {
    const sACNSenders = listToMap(
        senderConfiguration.universes,
        (universeId) =>
            new Sender({
                universe: universeId,
            }),
    );

    const timer = setInterval(async () => {
        senderConfiguration.universes.forEach(async (universeId) => {
            const sender = sACNSenders[universeId];
            const dataToSend = senderConfiguration.getDmxDataToSendForUniverse(universeId) ?? {};

            await sender.send({
                payload: dataToSend,
                sourceName: senderConfiguration.appName,
                priority: senderConfiguration.priority,
            });
        });
    }, sendInterval);

    return {
        timer,
        configuration: senderConfiguration,
    };
};

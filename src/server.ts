import express from 'express';
import next from 'next';
import { StateService } from './business-logic/stateService';
import { ReceiverConfiguration, SenderConfiguration } from './models';
import { configureReceiver } from './sacn/sacnReceiver';
import { configureSender } from './sacn/sacnSender';

const port = parseInt(process?.env?.PORT ?? '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    const stateService = new StateService();

    // Configure next js
    //
    server.all('/api/getCurrentState', (_req, res) => {
        res.send(stateService.getUniverseData());
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
    };
    const receiverData = configureReceiver(receiverConfiguration);
    stateService.configureReceiver(receiverData);

    const senderConfiguration: SenderConfiguration = {
        universes: [1, 2, 3, 4],
        appName: 'sACN Scene Recorder',
        priority: 90,
        getDmxDataToSendForUniverse: (universeId: number) => stateService.getDmxDataForUniverse(universeId),
    };
    const senderData = configureSender(senderConfiguration);
});

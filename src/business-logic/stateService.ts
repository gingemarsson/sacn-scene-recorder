import { ReceiverData, UniverseData } from '@/models';

export class StateService {
    private universeData: UniverseData;

    constructor() {
        this.universeData = {};
    }

    configureReceiver = (receiverData: ReceiverData) => {
        this.universeData = receiverData.universeData;
    };

    getUniverseData = () => {
        return this.universeData;
    };

    getDmxDataForUniverse = (universeId: number) => {
        return this.universeData[universeId]?.dmx;
    };
}

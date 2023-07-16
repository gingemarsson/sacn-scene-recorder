export type DmxUniverseData = Record<number, number>;

export type DmxUniverseState = {
    universeId: number;
    dmx: DmxUniverseData;
    priority: number;
    lastReceived: number;
    sender?: string;
};

export type ReceiverConfiguration = {
    onReceive: (dmxUniverseState: DmxUniverseState) => void;
    universes: number[];
    appName: string;
};

export type UniverseData = Record<number, DmxUniverseState>;

export type SenderConfiguration = {
    universes: number[];
    appName: string;
    priority: number;
    getDmxDataToSendForUniverse: (universe: number) => DmxUniverseData;
};

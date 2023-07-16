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

export type WebsocketCommand = {
    type: 'enable' | 'disable' | 'add' | 'update' | 'delete' | 'storeDmx' | 'removeDmx';
    sceneId?: string;
    metadata?: { name: string; color: string };
    universes?: number[];
};

export type SceneData = {
    id: string;
    created: number;
    updated: number;
    name: string;
    color: string;
    dmxData: Record<number, DmxUniverseData>;
    enabled: boolean;
};
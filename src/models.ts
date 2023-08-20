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
    type: 'enable' | 'disable' | 'toggle' | 'add' | 'update' | 'delete' | 'storeDmx' | 'removeDmx' | 'master';
    sceneId?: string;
    addData?: WebsocketCommandMetadata;
    updateData?: Partial<WebsocketCommandMetadata>;
    universes?: number[];
    value?: number;
};

export type WebsocketCommandMetadata = {
    name: string;
    color: string;
    category: string;
    mqttToggleTopic?: string | null;
    mqttTogglePath?: string;
    mqttToggleValue?: string;
    sortIndex: number;
    useMaster?: boolean;
    fade?: number;
    dmxEffects?: Record<number, DmxUniverseEffects>;
};

export type MqttCommand = {
    'source-id': string;
    command: 'enable' | 'disable' | 'status';
    sceneId?: string;
};
export type MqttReply = {
    'source-id': string;
    status: any;
};

export type Effect = {
    type: 'sin-wave';
    bpm: number;
    phase: number;
};

export type DmxUniverseEffects = Record<number, Effect>;

export type EffectData = {
    effect?: Effect;
    universeId: number;
    channelId: number;
};

export type SceneData = {
    id: string;
    created: number;
    updated: number;
    name: string;
    color: string;
    category: string;

    mqttToggleTopic: string | null;
    mqttTogglePath: string;
    mqttToggleValue: string;

    sortIndex: number;
    dmxData: Record<number, DmxUniverseData>;
    dmxEffects: Record<number, DmxUniverseEffects>;
    enabled: boolean;
    master: number;
    useMaster: boolean;
    fade: number;
    fadeEnableCompleted: number;
    fadeDisableCompleted: number;
};

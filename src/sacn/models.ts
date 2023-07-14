export type DmxUniverseData = Record<number, number>;

export type ReceiverConfiguration = {
    universes: number[];
    appName: string;
};

export type ReceiverData = {
    universeData: Record<
        number,
        {
            dmx: DmxUniverseData;
            priority: number;
            lastReceived: number;
            sender?: string | undefined;
        }
    >;
    configuration: ReceiverConfiguration;
};

export type SenderConfiguration = {
    universes: number[];
    appName: string;
    priority: number;
    getDmxDataToSendForUniverse: (universe: number) => DmxUniverseData;
};

export type SenderData = {
    configuration: SenderConfiguration;
    timer: NodeJS.Timer;
};

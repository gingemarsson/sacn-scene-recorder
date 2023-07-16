import { DmxUniverseData, DmxUniverseState } from '@/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { webcrypto } from 'crypto';

type SceneData = {
    id: string;
    created: Date;
    updated: Date;
    name: string;
    color: string;
    dmxData: Record<number, DmxUniverseData>;
    enabled: boolean;
};

const initialState: SceneData[] = [];

const scenesSlice = createSlice({
    name: 'scenes',
    initialState,
    reducers: {
        enableScene(state, action: PayloadAction<string>) {
            const scene = state.find((x) => x.id === action.payload);

            if (!scene) {
                return;
            }

            scene.enabled = true;
        },
        disableScene(state, action: PayloadAction<string>) {
            const scene = state.find((x) => x.id === action.payload);

            if (!scene) {
                return;
            }

            scene.enabled = false;
        },
        addScene(state, action: PayloadAction<{ name: string; color: string }>) {
            state.push({
                id: webcrypto.randomUUID(),
                name: action.payload.name,
                color: action.payload.color,
                created: new Date(),
                updated: new Date(),
                dmxData: {},
                enabled: false,
            });
        },
        deleteScene(state, action: PayloadAction<string>) {
            state = state.filter((x) => x.id !== action.payload);
        },
        updateScene(state, action: PayloadAction<{ id: string; name: string; color: string }>) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            const newName = action.payload.name?.trim();
            if (newName && newName.length > 0) {
                scene.name = newName;
                scene.updated = new Date();
            }

            const newColor = action.payload.color?.trim();
            if (newColor && newColor.length > 0) {
                scene.color = newColor;
                scene.updated = new Date();
            }
        },
        updateSceneWithDmx(state, action: PayloadAction<{ id: string; universes: DmxUniverseState[] }>) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            scene.dmxData = {};

            action.payload.universes.forEach((universeData) => {
                scene.dmxData[universeData.universeId] = universeData.dmx;
            });

            scene.updated = new Date();
        },
        removeDmxFromScene(state, action: PayloadAction<{ id: string; universes: DmxUniverseState[] }>) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            scene.dmxData = {};

            action.payload.universes.forEach((universeData) => {
                for (const address in universeData.dmx) {
                    const lastReceivedValue = universeData.dmx[address];
                    const storedValue = scene.dmxData[universeData.universeId][address];
                    if (lastReceivedValue === storedValue) {
                        delete scene.dmxData[universeData.universeId][address];
                    }
                }
            });

            scene.updated = new Date();
        },
    },
});

export const { enableScene, disableScene, addScene, deleteScene, updateScene } = scenesSlice.actions;

export default scenesSlice.reducer;

export const getDmxDataToSendForUniverse = (state: RootState, universeId: number) => {
    const enabledScenes = state.scenes.filter((x) => x.enabled);
    const dmxDataForUniverse = enabledScenes.map((x) => x.dmxData[universeId] ?? {});

    const mergedDmxData = dmxDataForUniverse.reduce(
        (merged, dmxData) => {
            for (const address in dmxData) {
                const value = dmxData[address];

                // Merge scenes with HTP
                if (merged[address] && merged[address] > value) {
                    continue;
                }

                merged[address] = value;
            }

            return merged;
        },
        {} as Record<number, number>,
    );

    return mergedDmxData;
};

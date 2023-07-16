import { DmxUniverseState, SceneData } from '@/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { webcrypto } from 'crypto';

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
        addScene(
            state,
            action: PayloadAction<{ name: string; color: string; category: string | null; sortIndex: number }>,
        ) {
            state.push({
                id: webcrypto.randomUUID(),
                name: action.payload.name,
                color: action.payload.color,
                category: action.payload.category,
                sortIndex: action.payload.sortIndex,
                created: Date.now(),
                updated: Date.now(),
                dmxData: {},
                enabled: false,
            });
        },
        deleteScene(state, action: PayloadAction<string>) {
            return state.filter((x) => x.id !== action.payload);
        },
        updateScene(
            state,
            action: PayloadAction<{
                id: string;
                name: string;
                color: string;
                category: string | null;
                sortIndex: number;
            }>,
        ) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            const newName = action.payload.name?.trim();
            if (newName && newName.length > 0) {
                scene.name = newName;
                scene.updated = Date.now();
            }

            const newColor = action.payload.color?.trim();
            if (newColor && newColor.length > 0) {
                scene.color = newColor;
                scene.updated = Date.now();
            }

            const newCategory = action.payload.category?.trim() ?? null;
            if (newCategory === null || (newCategory !== undefined && newCategory?.length > 0)) {
                scene.category = newCategory;
                scene.updated = Date.now();
            }

            const newSortIndex = action.payload.sortIndex;
            if (newSortIndex !== undefined && newSortIndex !== null) {
                scene.sortIndex = newSortIndex;
                scene.updated = Date.now();
            }
        },
        storeDmxToScene(state, action: PayloadAction<{ id: string; dmx: DmxUniverseState[] }>) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            scene.dmxData = {};

            action.payload.dmx.forEach((universeData) => {
                scene.dmxData[universeData.universeId] = universeData.dmx;
            });

            scene.updated = Date.now();
        },
        removeDmxFromScene(state, action: PayloadAction<{ id: string; dmx: DmxUniverseState[] }>) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            action.payload.dmx.forEach((universeData) => {
                for (const address in universeData.dmx) {
                    const lastReceivedValue = universeData.dmx[address];
                    const storedValue = (scene.dmxData[universeData.universeId] ?? {})[address];
                    if (lastReceivedValue === storedValue && storedValue !== undefined) {
                        delete scene.dmxData[universeData.universeId][address];
                    }
                }
            });

            scene.updated = Date.now();
        },
    },
});

export const { enableScene, disableScene, addScene, deleteScene, updateScene, storeDmxToScene, removeDmxFromScene } =
    scenesSlice.actions;

export default scenesSlice.reducer;

export const getScenes = (state: RootState) => state.scenes;

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

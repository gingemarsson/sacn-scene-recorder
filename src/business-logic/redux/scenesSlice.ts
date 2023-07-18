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

            if (scene.fade) {
                scene.fadeEnableCompleted = Date.now() + scene.fade;
            }
        },
        disableScene(state, action: PayloadAction<string>) {
            const scene = state.find((x) => x.id === action.payload);

            if (!scene) {
                return;
            }

            scene.enabled = false;

            if (scene.fade) {
                scene.fadeDisableCompleted = Date.now() + scene.fade;
            }
        },
        setMasterOfScene(state, action: PayloadAction<{ sceneId: string; value: number }>) {
            const scene = state.find((x) => x.id === action.payload.sceneId);

            if (!scene) {
                return;
            }

            scene.master = action.payload.value;
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
                master: 0,
                useMaster: false,
                fade: 0,
                fadeEnableCompleted: 0,
                fadeDisableCompleted: 0,
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
                useMaster: boolean;
                fade: number;
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

            const newUseMaster = action.payload.useMaster;
            if (newUseMaster !== undefined && newUseMaster !== null) {
                scene.useMaster = newUseMaster;
                scene.updated = Date.now();
            }

            const newFade = action.payload.fade;
            if (newFade !== undefined && newFade !== null) {
                scene.fade = newFade;
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
        reloadScenes(_state, action: PayloadAction<SceneData[]>) {
            return action.payload;
        },
    },
});

export const {
    enableScene,
    disableScene,
    setMasterOfScene,
    addScene,
    deleteScene,
    updateScene,
    storeDmxToScene,
    removeDmxFromScene,
    reloadScenes,
} = scenesSlice.actions;

export default scenesSlice.reducer;

export const getScenes = (state: RootState) => state.scenes;

export const getDmxDataToSendForUniverse = (state: RootState, universeId: number) => {
    const now = Date.now();

    const enabledScenes = state.scenes.filter((x) => x.enabled || x.fadeDisableCompleted > now);
    const mergedDmxData = enabledScenes.reduce(
        (merged, scene) => {
            const dmxData = scene.dmxData[universeId];
            const masterDimmer = scene.useMaster ? scene.master / 100 : 1;

            // In order to get a soft change form one fade to another, calculate fade in and out seperatly and take either the min or max value depending on if the enable or disable action was the latest.
            const fadeEnableDimmer =
                scene.fade && scene.fadeEnableCompleted > now
                    ? (scene.fade - (scene.fadeEnableCompleted - now)) / scene.fade
                    : 1;
            const fadeDisableDimmer =
                scene.fade && scene.fadeDisableCompleted > now ? (scene.fadeDisableCompleted - now) / scene.fade : 0;
            const fadeDimmer = scene.fade
                ? scene.fadeEnableCompleted > scene.fadeDisableCompleted
                    ? Math.max(fadeEnableDimmer, fadeDisableDimmer)
                    : Math.min(fadeEnableDimmer, fadeDisableDimmer)
                : 1;

            for (const address in dmxData) {
                const value = dmxData[address] * masterDimmer * fadeDimmer;

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

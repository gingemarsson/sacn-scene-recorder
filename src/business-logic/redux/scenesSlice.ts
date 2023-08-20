import { DmxUniverseState, SceneData } from '@/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { webcrypto } from 'crypto';
import { shuffleArray } from '../../lib/utils';

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
        toggleScene(state, action: PayloadAction<string>) {
            const scene = state.find((x) => x.id === action.payload);

            if (!scene) {
                return;
            }

            if (scene.enabled) {
                scenesSlice.caseReducers.disableScene(state, action);
            } else {
                scenesSlice.caseReducers.enableScene(state, action);
            }
        },
        setMasterOfScene(state, action: PayloadAction<{ sceneId: string; value: number }>) {
            const scene = state.find((x) => x.id === action.payload.sceneId);

            if (!scene) {
                return;
            }

            scene.master = action.payload.value;
        },
        addScene(state, action: PayloadAction<{ name: string; color: string; category: string; sortIndex: number }>) {
            state.push({
                id: webcrypto.randomUUID(),
                name: action.payload.name,
                color: action.payload.color,
                category: action.payload.category,
                sortIndex: action.payload.sortIndex,
                mqttToggleTopic: null,
                mqttTogglePath: 'event',
                mqttToggleValue: 'button-pressed',
                created: Date.now(),
                updated: Date.now(),
                dmxData: {},
                effectBpm: null,
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
                name?: string;
                color?: string;
                category?: string | null;
                mqttToggleTopic?: string | null;
                mqttTogglePath?: string;
                mqttToggleValue?: string;
                sortIndex?: number;
                useMaster?: boolean;
                fade?: number;
                effectBpm?: number | null;
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

            const newCategory = action.payload.category?.trim();
            if (newCategory && newCategory.length > 0) {
                scene.category = newCategory;
                scene.updated = Date.now();
            }

            const newMqttToggleTopic =
                action.payload.mqttToggleTopic === null ? null : action.payload.mqttToggleTopic?.trim();
            if (newMqttToggleTopic !== undefined) {
                scene.mqttToggleTopic = newMqttToggleTopic;
                scene.updated = Date.now();
            }

            const newMqttTogglePath = action.payload.mqttTogglePath?.trim();
            if (newMqttTogglePath) {
                scene.mqttTogglePath = newMqttTogglePath;
                scene.updated = Date.now();
            }

            const newMqttToggleValue = action.payload.mqttToggleValue?.trim();
            if (newMqttToggleValue) {
                scene.mqttToggleValue = newMqttToggleValue;
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

            const newEffectBpm = action.payload.effectBpm;
            if (newEffectBpm !== undefined) {
                scene.effectBpm = newEffectBpm;
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
    toggleScene,
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

const getPhaseForChannel = (scene: SceneData, universeId: number, channelId: number) => {
    const channels = Object.keys(scene.dmxData)
        .flatMap((universe) =>
            Object.keys(scene.dmxData[parseInt(universe)]).map((channel) => ({
                universeId: parseInt(universe),
                channelId: parseInt(channel),
                dmxValue: scene.dmxData[parseInt(universe)][parseInt(channel)],
            })),
        )
        .filter((x) => x.dmxValue > 0);

    // We use a fixed seed of 1000 to make the shuffle deterministic
    const shuffledChannels = shuffleArray(channels, 1000);

    return shuffledChannels.findIndex((x) => x.universeId == universeId && x.channelId === channelId) / channels.length;
    
};

const getEffectDimmer = (scene: SceneData, universeId: number, channelId: number) => {
    if (scene.effectBpm === null) {
        return 1;
    }

    const now = Date.now();
    const bpm = scene.effectBpm;
    const phase = getPhaseForChannel(scene, universeId, channelId);
    const effectPeriod = 60000 / bpm;
    const effectOffset = phase * effectPeriod;

    const effectDimmer = Math.sin((now + effectOffset) * bpm * Math.PI * 2 / (60 * 1000)) / 2 + 0.5;

    return effectDimmer;
};

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
                ? scene.fadeEnableCompleted >= scene.fadeDisableCompleted
                    ? Math.max(fadeEnableDimmer, fadeDisableDimmer)
                    : Math.min(fadeEnableDimmer, fadeDisableDimmer)
                : 1;

            for (const channelId in dmxData) {
                const effectDimmer = getEffectDimmer(scene, universeId, parseInt(channelId));
                const value = dmxData[channelId] * masterDimmer * fadeDimmer * effectDimmer;

                // Merge scenes with HTP
                if (merged[channelId] && merged[channelId] > value) {
                    continue;
                }

                merged[channelId] = value;
            }

            return merged;
        },
        {} as Record<number, number>,
    );

    return mergedDmxData;
};

export const getSceneStatus = (scenes: SceneData[]) => {
    const dictionary: Record<string, boolean> = {};
    scenes.forEach((scene) => (dictionary[scene.id] = scene.enabled ? true : false));
    return dictionary;
};

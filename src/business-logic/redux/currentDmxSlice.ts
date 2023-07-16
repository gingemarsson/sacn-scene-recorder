import { DmxUniverseState, UniverseData } from '@/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

const initialState: UniverseData = {};

const currentDmxSlice = createSlice({
    name: 'currentDmx',
    initialState,
    reducers: {
        dmxReceived(state, action: PayloadAction<DmxUniverseState>) {
            state[action.payload.universeId] = action.payload;
        },
    },
});

export const { dmxReceived } = currentDmxSlice.actions;

export default currentDmxSlice.reducer;

export const getDmxDataForUniverse = (state: RootState, universeId: number) => state.currentDmx[universeId];

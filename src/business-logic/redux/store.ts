import { configureStore } from '@reduxjs/toolkit';
import currentDmxSlice from './currentDmxSlice';
import scenesSlice from './scenesSlice';

export const store = configureStore({
    reducer: {
        currentDmx: currentDmxSlice,
        scenes: scenesSlice,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch
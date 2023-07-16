import { configureStore } from '@reduxjs/toolkit';
import currentDmxSlice from './currentDmxSlice';

export const store = configureStore({
    reducer: {
        currentDmx: currentDmxSlice,
    },
});

export type RootState = ReturnType<typeof store.getState>;

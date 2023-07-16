import { configureStore, Store } from '@reduxjs/toolkit';
import currentDmxSlice from './currentDmxSlice';
import scenesSlice from './scenesSlice';

export const store = configureStore({
    reducer: {
        currentDmx: currentDmxSlice,
        scenes: scenesSlice,
    },
});

// Store typings
//
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Store helper utils
//
export const observeStore = <T>(store: Store, select: (state: RootState) => T, onChange: (state: T) => void) => {
    let currentState: T;

    const handleChange = () => {
        let nextState = select(store.getState());
        if (nextState !== currentState) {
            currentState = nextState;
            onChange(currentState);
        }
    };

    let unsubscribe = store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
};

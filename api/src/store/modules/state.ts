import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StateSlice {
    [key: string]: any;
}

const initialState: StateSlice = {};

export const stateSlice = createSlice({
    name: 'state',
    initialState,
    reducers: {
        updateState: (state, action: PayloadAction<StateSlice>) => {
            return { ...state, ...action.payload };
        },
    },
});

export const { updateState } = stateSlice.actions;
export default stateSlice.reducer; 
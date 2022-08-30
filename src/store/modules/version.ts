import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	version: process.env.VERSION!, // This will be baked in at build time
	fullVersion: process.env.FULL_VERSION!, // This will be baked in at build time
};

export const version = createSlice({
	name: 'version',
	initialState,
	reducers: {},
});

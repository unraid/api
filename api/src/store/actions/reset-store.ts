import { createAction } from '@reduxjs/toolkit';

/**
 * Action to reset the store to its initial state.
 * This will be handled by the root reducer to reset all slices.
 */
export const resetStore = createAction('store/reset');
